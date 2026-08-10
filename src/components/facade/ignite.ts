// 窓グリッドの点灯シーケンス（GSAP island）。
// フォールバック要件: 静的HTMLの時点で作品セルは既に --c-facade-lit で描画されている。
// このスクリプトは「一瞬フル点灯してから微光に落ち着く」演出を上乗せするだけで、
// 実行されなくても（読み込み前/失敗時）全作品はリンクとして機能し視認できる。
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../motion/motionGuard';

gsap.registerPlugin(ScrollTrigger);

const STAGGER = 0.04;
const FLASH_DURATION = 0.12;
const SETTLE_DURATION = 0.18;

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// 実行時のビューポート幅で列数（延いては行の折り返し位置)が変わるため、
// data属性ではなく実際の offsetTop でグルーピングする。
function groupRowsBottomToTop(cells: HTMLElement[]): HTMLElement[][] {
  const tops = Array.from(new Set(cells.map((el) => el.offsetTop))).sort((a, b) => b - a);
  return tops.map((top) => cells.filter((el) => el.offsetTop === top));
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function initIgnite(): void {
  const grid = document.querySelector<HTMLElement>('.window-grid');
  if (!grid) return;

  const cells = Array.from(grid.querySelectorAll<HTMLElement>('[data-ignite="true"]'));
  if (cells.length === 0) return;

  if (prefersReducedMotion()) {
    // stagger を 0 にし、全セルを即座に最終状態（静的HTML通りの facade-lit）にする
    return;
  }

  const facade = readToken('--c-facade');
  const signal = readToken('--c-signal');
  const facadeLit = readToken('--c-facade-lit');

  ScrollTrigger.create({
    trigger: grid,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      const rows = groupRowsBottomToTop(cells);
      const ordered = rows.flatMap((row) => shuffle(row));

      ordered.forEach((cell, i) => {
        gsap
          .timeline({ delay: i * STAGGER })
          .set(cell, { backgroundColor: facade })
          .to(cell, { backgroundColor: signal, duration: FLASH_DURATION, ease: 'power2.out' })
          .to(cell, {
            backgroundColor: facadeLit,
            duration: SETTLE_DURATION,
            ease: 'power2.out',
            // アニメーション後はインラインstyleを外し、:hover/:focus-visible のCSSに制御を戻す
            clearProps: 'backgroundColor',
          });
      });
    },
  });
}
