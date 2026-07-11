#!/usr/bin/env python3
"""
Chroma-key: вырезает однотонный фон (по умолчанию маджента #FF00FF) в альфу.
Запасной путь, когда Nano Banana не отдаёт прозрачность напрямую.

Зависимости: pip install pillow numpy

Примеры:
  python tools/chroma_key.py in.png out.png
  python tools/chroma_key.py in.png out.png --key 00FF00 --tol 80 --feather 40
  python tools/chroma_key.py in.png out.png --height 320     # + ресайз по высоте
  python tools/chroma_key.py raw.png mid.png --despill        # глушит остаток хромы по краям
"""
import argparse
import sys

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Нужны зависимости: pip install pillow numpy")


def hex_to_rgb(s: str) -> tuple[int, int, int]:
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def chroma_key(img: Image.Image, key, tol: float, feather: float, despill: bool) -> Image.Image:
    rgba = np.asarray(img.convert("RGBA"), dtype=np.float32)
    rgb = rgba[..., :3]
    dist = np.sqrt(((rgb - np.array(key, dtype=np.float32)) ** 2).sum(axis=-1))
    # alpha: 0 внутри tol, плавно растёт до 255 на полосе feather
    alpha = np.clip((dist - tol) / max(feather, 1e-6), 0.0, 1.0) * 255.0
    out = rgba.copy()
    out[..., 3] = np.minimum(rgba[..., 3], alpha)
    if despill:
        # Глушим доминирующий канал ключа на ВСЕХ видимых пикселях: каппим его до максимума
        # двух других каналов. Если в целевой палитре этот канал не доминирует (напр. зелёный
        # для серо-фиолетового субъекта) — операция безвредна, а подмес цвета ключа убирается.
        kdom = int(np.argmax(key))
        others = [c for c in range(3) if c != kdom]
        cap = np.maximum(out[..., others[0]], out[..., others[1]])
        visible = out[..., 3] > 0
        spill = visible & (out[..., kdom] > cap)
        out[..., kdom] = np.where(spill, cap, out[..., kdom])
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def main() -> None:
    ap = argparse.ArgumentParser(description="Chroma-key фона в альфу")
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--key", default="FF00FF", help="цвет фона hex, по умолч. FF00FF (маджента)")
    ap.add_argument("--tol", type=float, default=70, help="радиус полного выреза")
    ap.add_argument("--feather", type=float, default=40, help="ширина мягкого края")
    ap.add_argument("--despill", action="store_true", help="глушить остаток цвета ключа на краях")
    ap.add_argument("--height", type=int, default=0, help="ресайз по высоте (ширина пропорц.)")
    ap.add_argument("--width", type=int, default=0, help="ресайз по ширине (высота пропорц.)")
    args = ap.parse_args()

    img = Image.open(args.input)
    img = chroma_key(img, hex_to_rgb(args.key), args.tol, args.feather, args.despill)

    if args.height:
        w = round(img.width * args.height / img.height)
        img = img.resize((w, args.height), Image.NEAREST)
    elif args.width:
        h = round(img.height * args.width / img.width)
        img = img.resize((args.width, h), Image.NEAREST)

    img.save(args.output)
    print(f"OK: {args.output}  {img.width}x{img.height}")


if __name__ == "__main__":
    main()
