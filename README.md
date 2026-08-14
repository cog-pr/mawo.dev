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
`public/fonts/` のサブセット済み woff2（合計約146KB）だけがリポジトリに含まれます。
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

- 発光している要素の画面占有面積は 25% 以下（2026-08-11 にネオン解禁で改訂）
- 光は一点に集めて強くする。同じ光量を全面にばらまかない
- **光を足すために周囲を暗くしない**。すでに十分暗く、落とすと見づらくなるだけ
- ネオンを足すときは必ず `src/styles/neon.css` のユーティリティを使う（仕様書 §6.4）

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
| LCP | 2.0s 以下 | 1.81s |
| CLS | 0.05 以下 | 0.000 |
| 初期JS (gzip) | 30KB 以下 | 6.0KB |
| フォント合計 | 200KB 以下 | 146KB |

3ページの LCP 中央値: トップ 1.81s / About 2.25s / 作品詳細 1.80s

> **「このサイトについて」だけ LCP の目標を 2.4s に緩めています。**
> 和文の分量が多く、LCP要素の導入文がフォントの到着を待つため。
> preload・coreサブセットへの移動・LCP要素の差し替えを試しましたが改善しませんでした。
> 内容を削るより実測値を公開する方を選んだ結果です。
> CI は `lighthouserc.json` の assertMatrix で**このページだけ**閾値を変えており、
> 他のページは 2.0s のまま落とします。

実測値は `npm run metrics:build` が `src/data/metrics.json` に書き出し、
`/about-this-site` がそれを読んで表示します。**手打ちしないでください**（陳腐化するため）。

計測は **gzip配信**（`scripts/static-server.mjs`）で行います。`astro preview` は
無圧縮配信のため、そのまま測ると本番より悪い数値になります。

> **`src/data/metrics.json` は CI が所有するファイルです。フィーチャーブランチからコミットしないでください。**
>
> main への push ごとに CI が再計測してコミットし返すため、ブランチ側でも
> コミットすると必ず衝突します。しかも**コンフリクトしたPRでは CI が起動しない**
> （GitHub がマージコミットを作れないため）ので、原因が分かりにくい形で詰まります。
>
> 手元で `npm run metrics:build` を回すのは確認目的なら問題ありません。
> ただしコミットはせず、`git checkout main -- src/data/metrics.json` で戻してください。
> 同じ理由で `public/fonts/` と `src/styles/fonts-jp.generated.css` も CI が更新します
> （こちらはコンテンツ追加時にブランチ側でも更新が必要なので、衝突したら再生成して解決します）。

> LCP は余裕が小さい指標です。ファーストビューに関わる資産（フォント・初期JS）を
> 増やす変更をしたら、`npm run budget:check` で3ページとも予算内か確認してください。

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

公開URL: **https://mawo.dev**

Worker のカスタムドメインとして設定しています（DNSレコードと証明書は Cloudflare が自動発行）。
`*.workers.dev` のURLも生きていますが、正規URLは `mawo.dev` です。

> **配信先を変えたら `astro.config.mjs` の `site` を直してください。**
> この値は canonical、OGPの画像URL、sitemap の各URLの基準になっているため、
> 実際の公開先とズレると、SNSにリンクを貼ってもカードが正しく表示されません。
> `public/robots.txt` の Sitemap 行も同じURLを持っているので、**2箇所セットで**直します。

## 検索エンジンからの見え方

個人の公式サイトなので、検索エンジンに示すべきなのは集客の文句ではなく**同一性**です。
「`mawo.dev` と GitHub の `cog-pr` と X の `cog__pr` は同じ人物のものである」——
これが伝われば足ります。仕様書 §11 に方針、
[意思決定ログ](src/content/notes/06-seo-identity.md) に経緯を記録しています。

### リポジトリ側の実装

| 出力 | 実装箇所 | 備考 |
| :-- | :-- | :-- |
| `canonical` | `src/layouts/Base.astro` | `astro.config.mjs` の `site` が基準 |
| OGP / Twitter Card | `src/layouts/Base.astro` | 画像は**絶対URL**（相対だと読まないクローラーがある） |
| 構造化データ（JSON-LD） | `src/layouts/Base.astro` | `siteJsonLd` プロップ。**トップページのみ** |
| `sitemap-index.xml` | `@astrojs/sitemap` | ビルド時に自動生成 |
| `robots.txt` | `public/robots.txt` | Sitemap 行に絶対URLを持つ |

JSON-LD は `Person`（`sameAs` で GitHub / X に紐付け）と `WebSite` を `@graph` で出します。

> **構造化データに書いてよいのは、検証できる事実だけです。**
> 名前・URL・アカウント・連絡先まで。肩書きや実績のような主観を入れないでください。
> 構造化データは文脈も根拠も添えられない形式なので、そこに検証できない情報を置くと
> 主張ではなく飾りになります。言いたいことがあるならサイト本文に書きます。

`Person` / `WebSite` は「サイトと運営者そのもの」の説明なので、
全ページに重複させずトップページにのみ出しています（`siteJsonLd` を渡すのは `index.astro` だけ）。

### リポジトリ外の設定（2026-08-14 実施）

コードに残らない作業なのでここに記録します。

- **Google Search Console のドメインプロパティ**を `mawo.dev` で作成
  （URLプレフィックスではなくドメイン。プロトコルとサブドメインの違いをまとめて扱えるため）
- 所有権確認は **Cloudflare DNS の TXT レコード**。既存の SPF / MX を壊していないことを確認済み
- `https://mawo.dev/sitemap-index.xml` を送信
- トップページの**インデックス登録をリクエスト**（優先クロールのキューに投入）
- GitHub リポジトリを `mawo.dev` から `portfolio-site` に**改名**
  （ドメインとの文字列衝突を消すため。remote URL の張り替えが必要になります）

### やらないこと

仕様書 §11.3。§1.2 のアンチパターンと同じ扱いです。

- 検索文字列に寄せた命名・見出し
- 本文中のキーワードの反復
- 自分で検証できない被リンク施策（ディレクトリ登録、相互リンク）
- 検索エンジン向けと人間向けで内容を変えること

**最も効いている対策は、JSなしで全作品の本文とリンクが読めることです。**
これはフェーズ3の原則としてすでに満たされており、SEOのために足したものではありません。

> **この項目だけ実測値がありません。** 順位は自分で決められる指標ではなく、
> 反映までの時間も制御できません。上に書いたのは打った手であって結果ではないため、
> 「このサイトについて」ページでもその区別が分かる形で書いています。
> 数値と並べて置かないでください。
