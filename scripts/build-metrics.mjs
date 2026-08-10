// Lighthouse を実測し、結果を src/data/metrics.json に書き出す。
// 「このサイトについて」ページはこのJSONを読んで表示する（手打ちしない＝陳腐化させない）。
//
// 実行前に `npm run build` が済んでいること。
// 配信は scripts/static-server.mjs（gzip あり＝本番と同条件）を使う。
// `astro preview` は非圧縮配信のため、そのまま計測すると本番より悪い数値が出る。
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { startStaticServer } from './static-server.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.METRICS_PORT ?? 4331);
const ORIGIN = `http://localhost:${PORT}`;

/** index.html が直接読み込む <script type="module"> だけを初期JSとして数える。
 *  動的import（GSAP / OGL）は初期転送に含まれないため対象外。 */
async function measureInitialJs() {
  const html = await readFile(path.join(DIST, 'index.html'), 'utf-8');
  const srcs = [...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  let total = 0;
  for (const src of srcs) {
    const file = path.join(DIST, src.replace(/^\//, ''));
    total += gzipSync(await readFile(file)).length;
  }
  return { bytes: total, files: srcs.length };
}

async function measureFonts() {
  const dir = path.join(ROOT, 'public', 'fonts');
  const files = await readdir(dir);
  let total = 0;
  for (const f of files.filter((f) => f.endsWith('.woff2'))) {
    // woff2 は既にブロトリ圧縮済みなので、そのままのサイズが転送量。
    total += (await readFile(path.join(dir, f))).length;
  }
  return { bytes: total, files: files.filter((f) => f.endsWith('.woff2')).length };
}

// Windows では npx が .cmd シムのため shell 経由でしか起動できない。
// ただし shell:true に引数配列を併用すると DEP0190 になるので、
// コマンドは常に単一文字列で渡す（引数はこのファイル内の固定値のみ）。
function run(commandLine, stdio) {
  return spawn(commandLine, { cwd: ROOT, stdio, shell: true });
}

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(ORIGIN, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      /* まだ起動していない */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`preview server did not start on ${ORIGIN}`);
}

async function runLighthouse() {
  const outPath = path.join(ROOT, '.lighthouse-tmp.json');
  await new Promise((resolve, reject) => {
    const child = run(
      [
        'npx lighthouse',
        ORIGIN,
        '--output=json',
        `--output-path="${outPath}"`,
        '--chrome-flags="--headless=new --no-sandbox"',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--form-factor=mobile',
        '--screenEmulation.mobile',
        '--throttling-method=simulate',
        '--quiet',
      ].join(' '),
      'inherit'
    );
    // Lighthouse は Windows で終了時に一時ディレクトリ削除に失敗して
    // 非ゼロ終了することがあるため、レポートが生成されていれば成功とみなす。
    child.on('exit', () => resolve());
    child.on('error', reject);
  });
  const report = JSON.parse(await readFile(outPath, 'utf-8'));
  await rm(outPath, { force: true });
  return report;
}

const server = await startStaticServer(PORT);
let report;
try {
  await waitForServer();
  report = await runLighthouse();
} finally {
  server.close();
}

const [initialJs, fonts] = await Promise.all([measureInitialJs(), measureFonts()]);

const metrics = {
  measuredAt: new Date().toISOString(),
  environment: 'Lighthouse (mobile, simulated throttling, gzip配信)',
  scores: {
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    bestPractices: Math.round(report.categories['best-practices'].score * 100),
    seo: Math.round(report.categories.seo.score * 100),
  },
  vitals: {
    lcpMs: Math.round(report.audits['largest-contentful-paint'].numericValue),
    cls: Number(report.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
    tbtMs: Math.round(report.audits['total-blocking-time'].numericValue),
    fcpMs: Math.round(report.audits['first-contentful-paint'].numericValue),
  },
  budget: {
    initialJsGzipBytes: initialJs.bytes,
    initialJsFileCount: initialJs.files,
    fontsBytes: fonts.bytes,
    fontsFileCount: fonts.files,
  },
};

const outDir = path.join(ROOT, 'src', 'data');
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');

console.log(JSON.stringify(metrics, null, 2));
