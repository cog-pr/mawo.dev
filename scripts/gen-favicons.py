"""favicon.ico と apple-touch-icon.png を public/favicon.svg のデザインから生成する。

実行:  python scripts/gen-favicons.py

生成物はリポジトリにコミットする静的素材で、サイトのビルドは
このスクリプトに依存しない（＝Pythonは通常不要）。
デザインを変えたときだけ手で回す。SVG側と数値を揃えること。
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

C_VOID = (0, 0, 0)
C_FACADE_LIT = (0x1A, 0x07, 0x40)
C_SIGNAL = (0x48, 0x05, 0xF1)

# favicon.svg と同じ 32x32 座標系での窓の位置
DARK_WINDOWS = [(6, 6), (20, 6), (6, 18)]
LIT_WINDOW = (20, 18)
WIN_W, WIN_H = 6, 8
GRID = 32


def render(size: int) -> Image.Image:
    """アンチエイリアスのため4倍で描いてから縮小する"""
    scale = 4
    s = size * scale
    im = Image.new("RGB", (s, s), C_VOID)
    d = ImageDraw.Draw(im)
    unit = s / GRID

    def rect(x: int, y: int, color: tuple[int, int, int]) -> None:
        d.rectangle(
            [x * unit, y * unit, (x + WIN_W) * unit - 1, (y + WIN_H) * unit - 1],
            fill=color,
        )

    for x, y in DARK_WINDOWS:
        rect(x, y, C_FACADE_LIT)
    rect(*LIT_WINDOW, C_SIGNAL)

    return im.resize((size, size), Image.LANCZOS)


def main() -> None:
    pub = ROOT / "public"

    ico_sizes = [16, 32, 48]
    render(64).save(
        pub / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
    )
    print(f"favicon.ico: {(pub / 'favicon.ico').stat().st_size / 1024:.1f}KB {ico_sizes}")

    apple = render(180)
    apple.save(pub / "apple-touch-icon.png", "PNG", optimize=True)
    print(
        f"apple-touch-icon.png: "
        f"{(pub / 'apple-touch-icon.png').stat().st_size / 1024:.1f}KB (180x180)"
    )


if __name__ == "__main__":
    main()
