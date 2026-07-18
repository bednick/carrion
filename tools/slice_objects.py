#!/usr/bin/env python3
"""
Режет composite-слой (mid/fore с несколькими силуэтами на прозрачном фоне) на отдельные объекты:
находит связные непрозрачные области по альфа-каналу, обрезает каждую по bounding box (+ паддинг)
и сохраняет как отдельный PNG. Объекты нумеруются слева направо по x центра bounding box.

Используется вместо генерации нового арта для mid/fore пула (docs/prompts/_style-guide.md) —
существующие composite-картинки уже содержат отдельные силуэты с прозрачными промежутками между
ними (см. style-guide), их достаточно разрезать.

Зависимости: pip install pillow numpy scipy

Пример:
  python tools/slice_objects.py public/backgrounds/zones/beast-lair/mid.1.png /tmp/beast-mid --prefix mid1
"""
import argparse
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
    from scipy import ndimage
except ImportError:
    sys.exit("Нужны зависимости: pip install pillow numpy scipy")


def main() -> None:
    ap = argparse.ArgumentParser(description="Режет composite-слой на отдельные объекты по альфе")
    ap.add_argument("input")
    ap.add_argument("out_dir")
    ap.add_argument("--prefix", default="obj")
    ap.add_argument("--alpha-thresh", type=int, default=10, help="порог альфы для маски объекта")
    ap.add_argument("--min-area", type=int, default=150, help="фильтр шумовых пятен (кол-во пикселей)")
    ap.add_argument("--pad", type=int, default=2, help="паддинг вокруг bounding box, px")
    ap.add_argument("--trim-bottom", type=int, default=0,
                     help="сколько нижних строк игнорировать при поиске связных областей (не при обрезке) — "
                          "используй, если по низу картинки идёт сплошная непрозрачная полоса-подложка, "
                          "склеивающая все силуэты в один объект")
    args = ap.parse_args()

    img = Image.open(args.input).convert("RGBA")
    arr = np.asarray(img)
    mask = arr[..., 3] > args.alpha_thresh

    # Маска для связности: обрезаем низ (полоса-подложка), чтобы не склеивать соседние силуэты.
    # Bounding box потом достраивается по ПОЛНОЙ (необрезанной) маске — сам силуэт не обрезается.
    label_mask = mask.copy()
    if args.trim_bottom > 0:
        label_mask[-args.trim_bottom:, :] = False

    labels, count = ndimage.label(label_mask, structure=np.ones((3, 3)))  # 8-связность
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    boxes = []
    for i in range(1, count + 1):
        ys, xs = np.where(labels == i)
        if len(xs) < args.min_area:
            continue
        x0, x1 = xs.min(), xs.max()
        y0 = ys.min()
        y1 = ys.max()
        # Нижнюю границу достраиваем ТОЛЬКО в пределах обрезанной трим-полосы (не по всей высоте —
        # иначе не связанный с этим объектом контент в тех же колонках ниже по картинке ошибочно
        # приклеится к bbox). Если в трим-полосе под этим объектом что-то есть — считаем, что это
        # обрезанная подложка, и дорисовываем крoп до самого низа картинки.
        if args.trim_bottom > 0:
            band = mask[-args.trim_bottom:, x0:x1 + 1]
            if band.any():
                y1 = img.height - 1
        boxes.append((x0, y0, x1, y1, len(xs)))

    boxes.sort(key=lambda b: (b[0] + b[2]) / 2)  # слева направо по центру X

    saved = []
    for idx, (x0, y0, x1, y1, area) in enumerate(boxes, start=1):
        x0p, y0p = max(0, x0 - args.pad), max(0, y0 - args.pad)
        x1p, y1p = min(img.width, x1 + args.pad + 1), min(img.height, y1 + args.pad + 1)
        crop = img.crop((x0p, y0p, x1p, y1p))
        out_path = out_dir / f"{args.prefix}_{idx:02d}.png"
        crop.save(out_path)
        saved.append((out_path, crop.size, area))

    for path, size, area in saved:
        print(f"{path}  {size[0]}x{size[1]}  area={area}")
    print(f"Всего объектов: {len(saved)} (вход: {img.width}x{img.height})")


if __name__ == "__main__":
    main()
