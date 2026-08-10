// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // 公開URL。sitemap の生成、canonical、OGPの絶対URLがこれを基準にする。
  // 独自ドメインを当てるまでは Cloudflare Pages の *.pages.dev を指す想定なので、
  // 実際の公開先が決まったらここを直すこと（直さないとOGPカードが壊れる）。
  site: 'https://mawo.dev',

  integrations: [sitemap()],

  build: {
    // CSSは全ページ合計でも数KB（gzip後 1〜2KB）しかない。
    // 外部ファイルにするとレンダーブロッキングの往復が1回増え、
    // モバイル回線ではそれが FCP→LCP に直接効く。インライン化して往復を消す。
    inlineStylesheets: 'always',
  },
});
