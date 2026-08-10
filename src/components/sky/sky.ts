// 光害の空: フルスクリーン三角形1枚 + フラグメントシェーダーのみ。
// マウス追従はしない（空は人間に反応しない）。色はCSSトークンから読み取り、
// シェーダー内に16進数を直書きしない。
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import fragment from './sky.frag?raw';

const vertex = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  // CSSミニファイア（Lightning CSS等）が #000000 を #000 に短縮するため、
  // 3桁省略形にも対応する。
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function readColorToken(name: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return hexToRgb(value);
}

export function initSky(container: HTMLElement): void {
  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    alpha: false,
  });
  const gl = renderer.gl;
  gl.canvas.style.display = 'block';
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  container.appendChild(gl.canvas);

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      u_time: { value: 0 },
      u_colorSignal: { value: readColorToken('--c-signal') },
      u_colorVoid: { value: readColorToken('--c-void') },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    const { clientWidth, clientHeight } = container;
    renderer.setSize(clientWidth, clientHeight);
  }
  window.addEventListener('resize', resize);
  resize();

  const start = performance.now();
  let rafId: number | null = null;

  function frame(now: number) {
    program.uniforms.u_time.value = (now - start) / 1000;
    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(frame);
  }

  function play() {
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  function pause() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // タブが非アクティブのときは rAF を止める
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else play();
  });

  play();
}
