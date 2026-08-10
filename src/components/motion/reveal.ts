// 汎用スクロールリビール。
//
// 重要（§10-1「JSなしで壊れないか」）: 初期状態を CSS で opacity:0 にしない。
// 隠す処理はこのスクリプトが動いたときに初めて適用する。そうしないと
// JSが落ちた瞬間に本文が永久に見えなくなる。
//
// GSAP は使わない。単純なフェードアップに44KBを払う必要がないため、
// IntersectionObserver + CSSトランジションで完結させる。
import { prefersReducedMotion } from './motionGuard';

const HIDDEN_CLASS = 'is-reveal-pending';
const SHOWN_CLASS = 'is-revealed';

export function initReveal(selector: string): void {
  if (prefersReducedMotion()) return;

  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (targets.length === 0) return;

  // JSが動いていることが確定してから隠す
  targets.forEach((el) => el.classList.add(HIDDEN_CLASS));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add(SHOWN_CLASS);
        observer.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -10% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}
