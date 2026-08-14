// 窓グリッドセクションのアイランドを1本のエントリにまとめたブートストラップ。
//
// なぜ1本か:
//   コンポーネントごとに <script> を持つと、Astro はそれぞれ別チャンクに分ける。
//   中身は各数百バイトなのに、読み込み直後の High 優先度リクエストが5〜6本になり、
//   フォントと帯域を奪い合って LCP を押し上げていた（実測でここが効いた）。
//   重い本体（GSAP / OGL）は従来どおり動的 import のままで、初期JSは増えない。
//
// ここに書くのは「いつ重い処理を取りに行くか」の判定だけ。
// 実際の演出は ignite.ts / sky.ts / rail.ts 側にある。
import { prefersReducedMotion } from './motionGuard';

/** 対象が視界に近づいたら一度だけ load() を呼ぶ */
function whenNear(target: Element, load: () => void, rootMargin = '200px 0px'): void {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin });
  observer.observe(target);
}

export function initIslands(): void {
  const section = document.querySelector<HTMLElement>('.works-section');
  if (!section) return;

  const reduced = prefersReducedMotion();

  // --- 作品看板の点灯シーケンス ---
  // 静的HTMLの時点で看板は読める状態で描画済み。これは上乗せの演出。
  const list = section.querySelector<HTMLElement>('.works');
  if (list && !reduced) {
    whenNear(list, () => {
      import('../facade/ignite').then(({ initIgnite }) => initIgnite());
    });
  }

  // --- 光害の空（WebGL）---
  // 条件を満たさないときは canvas を作らず、CSSの静的グラデーションが残る。
  const skyContainer = section.querySelector<HTMLElement>('[data-sky-container]');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const saveData = connection?.saveData === true;

  if (skyContainer && !reduced && !saveData) {
    whenNear(section, () => {
      const requestIdle =
        window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
      requestIdle(() => {
        import('../sky/sky').then(({ initSky }) => initSky(skyContainer));
      });
    });
  }

  // --- 縦組みレールのパララックス ---
  // 768px 未満ではレール自体が display:none なので動かす必要がない。
  const rail = section.querySelector<HTMLElement>('[data-rail-text]');
  if (rail && !reduced && window.innerWidth >= 768) {
    whenNear(section, () => {
      import('../rail/rail').then(({ initRail }) => initRail(rail, section));
    });
  }
}
