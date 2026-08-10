// fonts-src/ の元フォントを google/fonts リポジトリから取得する。
// fonts-src/ は .gitignore 対象（数MBの生フォントをリポジトリに含めないため）。
// サブセット済み woff2 は public/fonts/ に生成され、そちらがリポジトリに含まれる。
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SOURCES = {
  'Archivo.ttf':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf',
  'ZenKakuGothicNew-Regular.ttf':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/zenkakugothicnew/ZenKakuGothicNew-Regular.ttf',
  'ZenKakuGothicNew-Bold.ttf':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/zenkakugothicnew/ZenKakuGothicNew-Bold.ttf',
  'IBMPlexMono-Regular.ttf':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf',
};

const DEST = new URL('../fonts-src/', import.meta.url);
await mkdir(DEST, { recursive: true });

for (const [name, url] of Object.entries(SOURCES)) {
  const dest = new URL(name, DEST);
  if (existsSync(dest)) {
    console.log(`skip (exists): ${name}`);
    continue;
  }
  console.log(`fetching ${name} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`  -> ${dest.pathname} (${buf.length} bytes)`);
}
