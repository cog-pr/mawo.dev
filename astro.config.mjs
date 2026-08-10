// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  build: {
    // CSSは全ページ合計でも数KB（gzip後 1〜2KB）しかない。
    // 外部ファイルにするとレンダーブロッキングの往復が1回増え、
    // モバイル回線ではそれが FCP→LCP に直接効く。インライン化して往復を消す。
    inlineStylesheets: 'always',
  },
});
