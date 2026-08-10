// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // 公開URL。sitemap の生成、canonical、OGPの絶対URLがこれを基準にする。
  // 実際に配信されているURLと一致していないと、canonical が存在しないURLを指し、
  // SNSにリンクを貼ってもカードが表示されなくなる。
  //
  // 独自ドメイン mawo.dev を当てたら、ここと public/robots.txt の Sitemap 行を
  // 'https://mawo.dev' に戻すこと。
  site: 'https://mawo-dev.trco0430.workers.dev',

  integrations: [sitemap()],

  build: {
    // CSSは全ページ合計でも数KB（gzip後 1〜2KB）しかない。
    // 外部ファイルにするとレンダーブロッキングの往復が1回増え、
    // モバイル回線ではそれが FCP→LCP に直接効く。インライン化して往復を消す。
    inlineStylesheets: 'always',
  },
});
