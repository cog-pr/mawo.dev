// 窓グリッドのセル配置をビルド時に決定論的に計算する。
// シード固定の疑似乱数を使うことで、リロードのたびに配置が変わって
// 「別のサイトに見える」事態を避ける（§6.1）。
import type { CollectionEntry } from 'astro:content';

export type GridCell =
  | { type: 'work'; work: CollectionEntry<'works'> }
  | { type: 'dead' };

const SEED = 91127;
const TARGET_WORK_RATIO = 0.3; // 消灯セル65〜75%の範囲の中央

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function computeTotalCells(workCount: number): number {
  if (workCount === 0) return 16;
  let total = Math.round(workCount / TARGET_WORK_RATIO);
  while (workCount / total > 0.35) total++;
  while (total > workCount && workCount / (total - 1) <= 0.35 && workCount / (total - 1) >= 0.25) {
    total--;
  }
  return Math.max(total, workCount);
}

export function buildGridLayout(works: CollectionEntry<'works'>[]): GridCell[] {
  const sorted = [...works].sort((a, b) => a.data.order - b.data.order);
  const total = computeTotalCells(sorted.length);
  const random = mulberry32(SEED);

  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const litPositions = new Set(indices.slice(0, sorted.length));

  const cells: GridCell[] = [];
  let workIndex = 0;
  for (let i = 0; i < total; i++) {
    if (litPositions.has(i)) {
      cells.push({ type: 'work', work: sorted[workIndex] });
      workIndex++;
    } else {
      cells.push({ type: 'dead' });
    }
  }
  return cells;
}
