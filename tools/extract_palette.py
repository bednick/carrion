#!/usr/bin/env python3
"""
Extract palette: собирает общую палитру по набору иконок предметов, сливая похожие между собой
цвета в один канонический (жадная кластеризация по Евклидову расстоянию в RGB, взвешенная по
кол-ву пикселей). Нужен, когда каждый файл палетизировался (см. tools/palettize.py) независимо
своим k-means, и одинаковые по смыслу тона в разных предметах получили чуть разные RGB.

Результат — палитра N×1 в tools/palettes/, в том же формате, что и остальные файлы там, поэтому
её сразу можно использовать как `--palette <имя>` в tools/palettize.py. Плюс визуальный preview
(грид цветов с hex-подписями) для ручной проверки, что похожие оттенки слиплись, а разные — нет.

Зависимости: pip install pillow numpy

Примеры:
  python tools/extract_palette.py
  python tools/extract_palette.py --threshold 24
  python tools/extract_palette.py --input "src/items/*/icon.png" --output tools/palettes/carrion-items.png
"""
import argparse
import glob
import sys
from collections import Counter
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Нужны зависимости: pip install pillow numpy")

RGB = tuple[int, int, int]


def collect_colors(paths: list[Path], alpha_min: int = 1) -> Counter:
    """Суммарный пиксельный вес каждого видимого (alpha>=alpha_min) цвета по всем файлам."""
    counts: Counter = Counter()
    for path in paths:
        img = Image.open(path).convert("RGBA")
        arr = np.asarray(img)
        mask = arr[..., 3] >= alpha_min
        visible = arr[..., :3][mask]
        if visible.size == 0:
            continue
        colors, colors_count = np.unique(visible.reshape(-1, 3), axis=0, return_counts=True)
        for color, cnt in zip(colors, colors_count):
            counts[(int(color[0]), int(color[1]), int(color[2]))] += int(cnt)
    return counts


def cluster_colors(counts: Counter, threshold: float) -> list[dict]:
    """Жадная leader-кластеризация по убыванию частоты. Возвращает кластеры, отсортированные
    по убыванию суммарного веса: [{'color': (r,g,b), 'weight': int, 'members': [(color,count),...]}]."""
    clusters: list[dict] = []
    for color, cnt in sorted(counts.items(), key=lambda kv: kv[1], reverse=True):
        best_idx, best_dist = None, None
        for i, cluster in enumerate(clusters):
            dist = sum((a - b) ** 2 for a, b in zip(color, cluster["centroid"])) ** 0.5
            if best_dist is None or dist < best_dist:
                best_idx, best_dist = i, dist
        if best_idx is not None and best_dist <= threshold:
            cluster = clusters[best_idx]
            new_weight = cluster["weight"] + cnt
            cluster["centroid"] = tuple(
                (cluster["centroid"][i] * cluster["weight"] + color[i] * cnt) / new_weight
                for i in range(3)
            )
            cluster["weight"] = new_weight
            cluster["members"].append((color, cnt))
        else:
            clusters.append({"centroid": tuple(float(c) for c in color), "weight": cnt,
                              "members": [(color, cnt)]})

    clusters.sort(key=lambda c: c["weight"], reverse=True)
    return [
        {"color": tuple(round(c) for c in cl["centroid"]), "weight": cl["weight"], "members": cl["members"]}
        for cl in clusters
    ]


def save_palette_png(clusters: list[dict], path: Path) -> None:
    """N×1 PNG, отсортировано по убыванию weight — совместимо с resolve_palette_arg() в palettize.py."""
    img = Image.new("RGB", (len(clusters), 1))
    img.putdata([cl["color"] for cl in clusters])
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def render_preview(clusters: list[dict], path: Path, swatch: int = 48, cols: int = 10) -> None:
    """Грид PNG: квадрат цвета + подпись hex + вес, для ручного просмотра."""
    rows = (len(clusters) + cols - 1) // cols
    label_h = 28
    img = Image.new("RGB", (cols * swatch, rows * (swatch + label_h)), (32, 32, 32))
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    for i, cluster in enumerate(clusters):
        col, row = i % cols, i // cols
        x0, y0 = col * swatch, row * (swatch + label_h)
        draw.rectangle([x0, y0, x0 + swatch - 1, y0 + swatch - 1], fill=cluster["color"])
        hex_code = "#%02x%02x%02x" % cluster["color"]
        draw.text((x0 + 2, y0 + swatch + 2), hex_code, fill=(230, 230, 230), font=font)
        draw.text((x0 + 2, y0 + swatch + 14), f"n={len(cluster['members'])}", fill=(160, 160, 160), font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        description="Собирает общую палитру по иконкам, сливая похожие между собой цвета")
    ap.add_argument("--input", default="src/items/*/icon.png",
                     help="glob входных файлов (по умолч. src/items/*/icon.png)")
    ap.add_argument("--threshold", type=float, default=18.0,
                     help="порог Евклидова расстояния RGB для слияния цветов (по умолч. 18.0)")
    ap.add_argument("--alpha-min", type=int, default=1,
                     help="минимальная альфа, чтобы пиксель считался видимым (по умолч. 1)")
    ap.add_argument("--min-weight", type=int, default=0,
                     help="отбросить кластеры с суммарным весом меньше N пикселей — отсеивает "
                          "единичные антиалиасинг-артефакты, которые не являются осмысленным "
                          "цветом палитры (по умолч. 0 — не фильтровать)")
    ap.add_argument("--output", default="tools/palettes/carrion-items.png",
                     help="куда сохранить итоговую палитру (по умолч. tools/palettes/carrion-items.png)")
    ap.add_argument("--preview", default="_local/palettize/carrion-items-preview.png",
                     help="куда сохранить визуальный preview (по умолч. _local/palettize/carrion-items-preview.png)")
    return ap


def main() -> int:
    ap = build_arg_parser()
    args = ap.parse_args()

    paths = [Path(p) for p in sorted(glob.glob(args.input))]
    if not paths:
        ap.error(f"по glob '{args.input}' ничего не найдено")

    counts = collect_colors(paths, args.alpha_min)
    clusters = cluster_colors(counts, args.threshold)
    dropped = [c for c in clusters if c["weight"] < args.min_weight]
    clusters = [c for c in clusters if c["weight"] >= args.min_weight]

    save_palette_png(clusters, Path(args.output))
    render_preview(clusters, Path(args.preview))

    print(f"файлов: {len(paths)}")
    print(f"уникальных цветов на входе: {len(counts)}")
    print(f"кластеров после слияния (threshold={args.threshold}): {len(clusters) + len(dropped)}")
    if args.min_weight:
        print(f"отброшено как шум (weight<{args.min_weight}px): {len(dropped)}")
    print(f"итоговых цветов палитры: {len(clusters)}")
    print()
    for cluster in clusters:
        hex_code = "#%02x%02x%02x" % cluster["color"]
        print(f"  {hex_code}  вес={cluster['weight']:6d}px  слито_из={len(cluster['members'])}")
    print()
    print(f"палитра: {args.output}")
    print(f"preview: {args.preview}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
