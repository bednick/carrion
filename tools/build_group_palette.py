#!/usr/bin/env python3
"""
Build group palette: строит общую палитру фиксированного размера (k-means) по набору
спрайтов — для групп мобов по типу локации (нежить/звери/люди), чтобы прогнать
tools/palettize.py --palette <group> по каждому мобу группы и привести их к единой
цветовой гамме.

В отличие от tools/extract_palette.py (жадная кластеризация по порогу расстояния,
переменное число цветов на выходе) — здесь ровно N цветов через k-means quantize, как в
tools/palettize.py (--colors), только источник пикселей — сразу несколько файлов.

Только видимые (alpha>0) пиксели. При необходимости пиксели сэмплируются (--sample) —
для устойчивости и скорости k-means на больших группах, точность палитры от этого не
страдает (частые цвета остаются частыми).

Зависимости: pip install pillow numpy

Аргументы:
  input                 glob входных файлов (например 'public/sprites/mobs/{a,b,c}/base.png'
                        не работает в bash-glob с --input — передавай несколько --input
                        через список путей файлом, см. --list-file)
  --list-file           путь к текстовому файлу со списком путей (по одному на строку) —
                        удобнее glob'а, когда группа мобов не выражается одним паттерном
  --colors N            число цветов палитры (по умолч. 64)
  --sample N            макс. число пикселей для k-means, остальное отбрасывается случайно
                        (по умолч. 300000, 0 = без сэмплирования)
  --output              куда сохранить палитру (N×1 PNG)
  --preview             куда сохранить грид-превью с hex-подписями

Примеры:
  python tools/build_group_palette.py --list-file /tmp/undead.txt --output tools/palettes/undead.png
"""
import argparse
import glob
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Нужны зависимости: pip install pillow numpy")


def collect_pixels(paths: list[Path]) -> np.ndarray:
    chunks = []
    for path in paths:
        img = Image.open(path).convert("RGBA")
        arr = np.asarray(img)
        mask = arr[..., 3] > 0
        chunks.append(arr[..., :3][mask])
    return np.concatenate(chunks, axis=0)


def build_palette(pixels: np.ndarray, colors: int) -> list[tuple[int, int, int]]:
    img = Image.fromarray(pixels.reshape(1, -1, 3), mode="RGB")
    quantized = img.quantize(colors=colors, method=1, kmeans=colors, dither=0)
    pal = quantized.convert("RGB").getcolors(16777216)
    # сортируем по убыванию веса — совместимо с форматом resolve_palette_arg() в palettize.py
    pal.sort(key=lambda c: c[0], reverse=True)
    return [c for _, c in pal]


def save_palette_png(colors: list[tuple[int, int, int]], path: Path) -> None:
    img = Image.new("RGB", (len(colors), 1))
    img.putdata(colors)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def render_preview(colors: list[tuple[int, int, int]], path: Path, swatch: int = 48, cols: int = 8) -> None:
    rows = (len(colors) + cols - 1) // cols
    label_h = 16
    img = Image.new("RGB", (cols * swatch, rows * (swatch + label_h)), (32, 32, 32))
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    for i, color in enumerate(colors):
        col, row = i % cols, i // cols
        x0, y0 = col * swatch, row * (swatch + label_h)
        draw.rectangle([x0, y0, x0 + swatch - 1, y0 + swatch - 1], fill=color)
        draw.text((x0 + 2, y0 + swatch + 1), "#%02x%02x%02x" % color, fill=(230, 230, 230), font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", nargs="?", help="glob входных файлов")
    ap.add_argument("--list-file", help="файл со списком путей, по одному на строку")
    ap.add_argument("--colors", type=int, default=64)
    ap.add_argument("--sample", type=int, default=300_000)
    ap.add_argument("--output", required=True)
    ap.add_argument("--preview", required=True)
    args = ap.parse_args()

    if args.list_file:
        paths = [Path(line.strip()) for line in Path(args.list_file).read_text().splitlines() if line.strip()]
    elif args.input:
        paths = sorted(Path(p) for p in glob.glob(args.input, recursive=True))
    else:
        ap.error("нужен input или --list-file")

    if not paths:
        ap.error("список входных файлов пуст")

    pixels = collect_pixels(paths)
    print(f"файлов: {len(paths)}, видимых пикселей: {len(pixels)}")

    if args.sample and len(pixels) > args.sample:
        rng = np.random.default_rng(0)
        idx = rng.choice(len(pixels), size=args.sample, replace=False)
        pixels = pixels[idx]
        print(f"сэмплировано до {len(pixels)}")

    colors = build_palette(pixels, args.colors)
    print(f"итоговых цветов: {len(colors)}")

    save_palette_png(colors, Path(args.output))
    render_preview(colors, Path(args.preview))
    print(f"палитра: {args.output}")
    print(f"preview: {args.preview}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
