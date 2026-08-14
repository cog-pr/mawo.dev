import { getCollection } from 'astro:content';

/*
  公開中の成果物を並び順で返す。

  「下書きを外す」「order で並べる」の2つは、一覧・トップの入口・件数表示など
  複数箇所で必要になる。条件がずれると「一覧には出ないのに件数には入っている」
  ような食い違いが起きるので、取得口を1つにまとめている。
*/
export async function getPublishedWorks() {
  const works = await getCollection('works', ({ data }) => !data.draft);
  return [...works].sort((a, b) => a.data.order - b.data.order);
}
