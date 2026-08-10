# 夜のビルの窓 — ポートフォリオサイト

制作物を「夜のビルの窓」として見せる、黒と紫のポートフォリオサイト。
派手な演出を持ちながら Lighthouse 95+ を維持することそのものが、このサイトの主張です。

実装仕様は [仕様書.md](仕様書.md) を参照してください。

## セットアップ

```sh
npm install
npm run fonts:fetch     # 元フォントを google/fonts から取得（fonts-src/、リポジトリ非追跡）
npm run dev
```

`fonts-src/` は数MBの生フォントのため `.gitignore` 対象です。
`public/fonts/` のサブセット済み woff2（合計約136KB）だけがリポジトリに含まれます。
コミット済みのフォントがあるので、開発を始めるだけならサブセット化は不要です。

## コマンド

| コマンド | 内容 |
| :-- | :-- |
| `npm run dev` | 開発サーバー（`localhost:4321`） |
| `npm run build` | `./dist/` へビルド（フォントは再生成しない） |
| `npm run build:full` | **デプロイ用**。ビルド → フォント再生成 → 再ビルド |
| `npm run preview` | ビルド結果のプレビュー（非圧縮配信） |
| `npm run serve:dist` | 本番同等（gzip）で `dist/` を配信 |
| `npm run fonts:fetch` | 元フォントの取得 |
| `npm run fonts:subset` | フォントのサブセット化（要 `dist/`） |
| `npm run metrics:build` | Lighthouse を実測し `src/data/metrics.json` を更新 |
| `npm run budget:check` | 3ページ×3回の中央値で §8 の予算を検証 |
| `npx astro check` | 型チェック |

ブランド素材の生成は Python（Pillow）を使う別枠のツールです。生成物はコミット済みなので、
**通常のビルドや開発に Python は不要**です。素材を変えたときだけ回します。

| コマンド | 内容 |
| :-- | :-- |
| `python scripts/gen-og-image.py` | `public/og.jpg`（OGP画像）を生成。要 `fonts-src/` |
| `python scripts/gen-favicons.py` | `favicon.ico` と `apple-touch-icon.png` を生成 |
| `node scripts/gen-placeholder-images.mjs` | 作品のダミー画像を生成 |

> **コンテンツを追加・変更したら `npm run build:full` を使ってください。**
> 和文フォントは「出力HTMLに実際に現れた文字」だけを抽出しているため、
> 新しい文字を含むコンテンツを足すと、そのままでは字形が欠けます。
> CI（push時）も同じ処理を回し、差分があれば自動でコミットし返します。

### なぜビルドが2回なのか

CSSをインライン化している（`astro.config.mjs`）関係で、和文フォントの
`unicode-range` がHTMLに焼き込まれます。サブセット対象の文字は出力HTMLから
集めるため、順序は **ビルド → サブセット → 再ビルド** になります。
文字抽出時に `<style>` を除くので、この処理は必ず収束します（実測で確認済み）。

## 設計上の中核原則

> **闇が主役で、光は例外である。**

- 発光色 `--c-signal` の画面占有面積は常に 10% 以下
- グロー（`box-shadow` による発光）は原則禁止。例外は窓グリッドのホバー中セル1つのみ
- 光を足したくなったら、先に周囲を暗くできないか検討する

判断に迷ったときの優先順位（仕様書 §10）:

1. JSなしで壊れないか
2. 面積原則を守っているか
3. アンチパターン（§1.2）に触れていないか
4. パフォーマンス予算内か
5. その上で、面白いか

## アーキテクチャ

### フェーズ構造

**フェーズ3（静的な窓グリッド）の時点でサイトとして完成しています。**
4以降はすべて上乗せであり、削っても機能を失いません。この構造は崩さないでください。

| 層 | 内容 | 落ちたときの挙動 |
| :-- | :-- | :-- |
| 静的HTML | 全作品のリンク・本文・画像 | — |
| CSS のみ | ホバー/フォーカス点灯、キャプション表示 | — |
| GSAP（遅延） | 点灯シーケンス、縦組みレールのパララックス | 静的な最終状態のまま |
| OGL（遅延） | 光害の空 | CSS の静的グラデーションが残る |

### JS の載せ方

初期JSは **6.0KB (gzip) / 2リクエスト** で、内訳は Astro の ClientRouter と、
アイランド起動用のブートストラップ1本だけです。
GSAP（約44KB）と OGL（約14KB）は動的 `import()` で、以下の条件を満たしたときだけ取得されます。

- **点灯シーケンス**: グリッドが視界に入る & reduced-motion でない
- **光害の空**: 上記に加えて `requestIdleCallback` & `saveData` でない
- **縦組みレール**: 上記に加えて 768px 以上
- **点灯デモ**（About ページ）: スライダー操作 or REPLAY クリック時

`prefers-reduced-motion: reduce` のときは、これらのチャンクを**そもそもダウンロードしません**。

> **コンポーネントごとに `<script>` を増やさないでください。**
> 窓グリッドセクションのアイランドは `components/motion/islands.ts` の1本にまとめています。
> 分けると数百バイトのチャンクが別リクエストになり、初期ロードでフォントと帯域を奪い合って
> LCP が悪化します（実測で約 40ms、リクエスト数 4→2）。

### フォントの積み方

ファーストビューの資産は LCP に直結するため、次の制約を守ってください。

- **`.font-display`（Archivo）は weight 700 のみ**。ウェイトを増やすとファイルとリクエストが
  増え、実測で LCP が 1.86s → 2.10s まで悪化しました。
- **preload するのは Archivo だけ**。IBM Plex Mono や和文まで足すと帯域を奪い合い、
  かえって遅くなります（実測で確認済み）。
- **和文 Regular はトップページ用（core）と残り（ext）に `unicode-range` で分割**しています。
  分割の境界は実測で決めたもので、core を広げるとトップの LCP が悪化します。

いずれも `scripts/subset-fonts.mjs` と `src/styles/fonts.css` に理由をコメントで残しています。
変更したら必ず `npm run budget:check` を回してください。

### ディレクトリ

```
src/
├── components/
│   ├── facade/       # 窓グリッド（署名要素）+ 点灯シーケンス + Aboutページ用デモ
│   ├── sky/          # 光害の空（OGL + フラグメントシェーダー）
│   ├── rail/         # 縦組みレール
│   ├── motion/       # reduced-motion 判定の単一窓口
│   └── layout/       # ヘッダー・フッター
├── content/          # works（作品） / notes（意思決定ログ）
├── data/metrics.json # Lighthouse 実測値（自動生成。手で編集しない）
├── layouts/
├── pages/
└── styles/           # tokens.css を一次情報とするカスケードレイヤー構成
```

> **`src/layouts/Base.astro` では、スタイルの import をコンポーネントの import より先に置いてください。**
> Vite はモジュールグラフを深さ優先で辿って CSS をバンドルするため、順序を入れ替えると
> コンポーネント側の `@layer components` が reset/base より前に出力され、レイヤー順序が壊れます。

## コンテンツの追加

作品は `src/content/works/` に1ファイル1作品で追加します（スキーマは `src/content.config.ts`）。
`draft: true` の作品は本番ビルドから除外されます。

意思決定ログは `src/content/notes/` に追加します。
**`alternatives`（検討したが採用しなかった選択肢）は必須です。** 採用しなかった選択肢を語れることが、
このサイトの差別化要素そのものだからです。

## パフォーマンス予算

`lighthouserc.json` に定義され、GitHub Actions（`.github/workflows/lighthouse.yml`）で
PR ごとに検証されます。**予算割れはビルド失敗**です。達成できないなら演出を削ってください。

| 指標 | 目標 | 実測（トップ） |
| :-- | :-- | :-- |
| Performance | 95 以上 | 99 |
| Accessibility | 100 | 100 |
| LCP | 2.0s 以下 | 1.86s |
| CLS | 0.05 以下 | 0.000 |
| 初期JS (gzip) | 30KB 以下 | 6.0KB |
| フォント合計 | 200KB 以下 | 125KB |

3ページの LCP 中央値: トップ 1.86s / About 1.95s / 作品詳細 1.66s（いずれも予算内）

実測値は `npm run metrics:build` が `src/data/metrics.json` に書き出し、
`/about-this-site` がそれを読んで表示します。**手打ちしないでください**（陳腐化するため）。

計測は **gzip配信**（`scripts/static-server.mjs`）で行います。`astro preview` は
無圧縮配信のため、そのまま測ると本番より悪い数値になります。

> LCP は目標 2.0s に対して実測 1.87s と余裕が小さい指標です。
> ファーストビューに関わる資産（フォント・初期JS）を増やす変更をしたら、
> `npm run budget:check` で3ページとも予算内に収まっているか確認してください。

## デプロイ

**Cloudflare Workers（Static Assets）** で配信します。設定は `wrangler.jsonc` にあります。
完全な静的サイトなので Worker スクリプトは持たず、アセットのみを配信する構成です。

Pages ではなく Workers を選んだ理由は
[意思決定ログ](src/content/notes/05-workers-over-pages.md) に記録しています。

### Workers Builds（推奨）

ダッシュボードでリポジトリを接続すると、push で自動デプロイされ、PRごとにプレビューURLが発行されます。

- ビルドコマンド: `npm run fonts:fetch && npm run build:full`
- 出力ディレクトリ: `dist`

### 手元からデプロイする場合

```sh
npm run fonts:fetch
npm run build:full
npx wrangler deploy
```

現在の公開URL: https://mawo-dev.trco0430.workers.dev

> **公開先を変えたら `astro.config.mjs` の `site` を直してください。**
> この値は canonical、OGPの画像URL、sitemap の各URLの基準になっているため、
> 実際の公開先とズレると、SNSにリンクを貼ってもカードが表示されなくなります。
> `public/robots.txt` の Sitemap 行も同じURLを持っているので、両方を直します。
>
> 独自ドメイン `mawo.dev` を当てるときは、この2箇所を `https://mawo.dev` に戻してください。
