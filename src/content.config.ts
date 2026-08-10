import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // 和文タイトル
      titleEn: z.string().optional(), // 欧文タイトル（Archivo で表示）
      year: z.number(),
      roles: z.array(z.string()), // 例: ['設計', '実装']
      stack: z.array(z.string()), // 例: ['Astro', 'GSAP']
      summary: z.string().max(120), // 一覧のホバー時に出る一文
      thumbnail: image(), // 窓セル内に表示
      cover: image(), // 詳細ページのヘッダー
      // 仕様書は z.string().url() 表記だが、zod v4 では非推奨。検証内容は同一。
      url: z.url().optional(),
      order: z.number(), // グリッド内の並び順（小さいほど先）
      draft: z.boolean().default(false),
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    decision: z.string(), // 何を決めたか
    alternatives: z.array(
      z.object({
        // 検討した他の選択肢
        option: z.string(),
        why_not: z.string(),
      })
    ),
    verdict: z.string(), // 決め手
  }),
});

export const collections = { works, notes };
