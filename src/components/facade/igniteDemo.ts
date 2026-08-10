// 「このサイトについて」ページの点灯シーケンスデモ。
// トップページの ignite.ts と同じ「下から上へ / 一瞬フル点灯してから微光に落ち着く」挙動を、
// stagger と duration だけ差し替え可能にしたもの。
import { gsap } from 'gsap';

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

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

export function createDemoPlayer(
  grid: HTMLElement
): (values: { stagger: number; duration: number }) => void {
  const cells = Array.from(grid.querySelectorAll<HTMLElement>('[data-demo-cell]'));
  const facade = readToken('--c-facade');
  const signal = readToken('--c-signal');
  const facadeLit = readToken('--c-facade-lit');

  let timelines: gsap.core.Timeline[] = [];

  return function play({ stagger, duration }) {
    // 連打・スライダー連続操作で再生が重ならないよう、前回分を止めてから開始する
    timelines.forEach((tl) => tl.kill());
    timelines = [];

    const ordered = groupRowsBottomToTop(cells).flatMap((row) => shuffle(row));
    // トップページと同じ比率（点灯:落ち着き = 0.12:0.18）を保ったまま尺だけ変える
    const flash = duration * 0.4;
    const settle = duration * 0.6;

    ordered.forEach((cell, i) => {
      const tl = gsap
        .timeline({ delay: i * stagger })
        .set(cell, { backgroundColor: facade })
        .to(cell, { backgroundColor: signal, duration: flash, ease: 'power2.out' })
        .to(cell, {
          backgroundColor: facadeLit,
          duration: settle,
          ease: 'power2.out',
          clearProps: 'backgroundColor',
        });
      timelines.push(tl);
    });
  };
}
