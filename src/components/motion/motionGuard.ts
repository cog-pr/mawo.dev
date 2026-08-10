// prefers-reduced-motion 判定の単一窓口。
// アニメーションを書くすべての箇所はここを経由すること（判定ロジックを散らばらせない）。
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
