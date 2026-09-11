#!/usr/bin/env python3
"""
Fill alpha holes: закрашивает одиночные/мелкие прозрачные "дырки" внутри непрозрачного
спрайта — артефакт квантования альфы (pngquant/палетизация), не задуманная прозрачность.

Отличает артефакт от осмысленной прозрачности (просветы между руками/ногами, глазницы) по
размеру связной компоненты: маленькие "дырки", полностью окружённые непрозрачными пикселями
(не касаются края картинки), закрашиваются; крупные — не трогаются. На выборке мобов проекта
между ними чёткий разрыв: артефакты ≤~40px, осмысленные просветы — от ~150px, дефолтный порог
--max-hole-size 64 лежит посередине с запасом.

Закраска — итеративное усреднение цвета уже закрашенных/исходно непрозрачных 4-соседей
(диффузия внутрь дырки слоями), не однородная заливка одним цветом на всю дырку — так
сохраняется локальный градиент на границе.

Зависимости: pip install pillow numpy

Аргументы:
  input                 glob входных файлов (например 'public/sprites/mobs/**/*.png')
  --max-hole-size N      макс. размер связной компоненты (в пикселях), которая считается
                        артефактом и закрашивается (по умолч. 64)
  --dry-run             только напечатать отчёт (сколько дырок закрашено/пропущено на файл),
                        файлы не менять

Примеры:
  python tools/fill_alpha_holes.py 'public/sprites/mobs/**/*.png' --dry-run
  python tools/fill_alpha_holes.py 'public/sprites/mobs/**/*.png'
  python tools/fill_alpha_holes.py public/sprites/mobs/skinner/base.png
"""
import argparse
import glob
import sys
from collections import deque
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Нужны зависимости: pip install pillow numpy")


def find_interior_components(alpha: np.ndarray) -> list[list[tuple[int, int]]]:
    """Связные компоненты (4-connectivity) прозрачных (alpha==0) пикселей, которые НЕ
    касаются края картинки — кандидаты в "дырки"-артефакты."""
    h, w = alpha.shape
    transparent = alpha == 0
    visited = np.zeros((h, w), dtype=bool)
    components = []
    for y in range(h):
        for x in range(w):
            if not transparent[y, x] or visited[y, x]:
                continue
            q = deque([(y, x)])
            visited[y, x] = True
            comp = []
            touches_border = False
            while q:
                cy, cx = q.popleft()
                comp.append((cy, cx))
                if cy == 0 or cy == h - 1 or cx == 0 or cx == w - 1:
                    touches_border = True
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and transparent[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        q.append((ny, nx))
            if not touches_border:
                components.append(comp)
    return components


def fill_holes(rgb: np.ndarray, alpha: np.ndarray, holes: list[tuple[int, int]]) -> None:
    """Итеративная диффузия цвета внутрь дырки от уже непрозрачных соседей, in-place."""
    h, w, _ = rgb.shape
    remaining = set(holes)
    opaque = alpha > 0
    while remaining:
        progressed = False
        still_remaining = set()
        for (y, x) in remaining:
            neighbors = [(ny, nx) for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1))
                         if 0 <= ny < h and 0 <= nx < w and opaque[ny, nx]]
            if not neighbors:
                still_remaining.add((y, x))
                continue
            cols = np.array([rgb[ny, nx] for ny, nx in neighbors], dtype=np.float64)
            als = np.array([alpha[ny, nx] for ny, nx in neighbors], dtype=np.float64)
            rgb[y, x] = np.round(cols.mean(axis=0)).astype(np.uint8)
            alpha[y, x] = np.round(als.mean())
            progressed = True
        if not progressed:
            # изолированная дырка без непрозрачных соседей (не должно происходить для
            # компонент из find_interior_components, но на всякий случай не зацикливаемся)
            break
        # только что закрашенные пиксели становятся непрозрачными соседями для следующего слоя
        for (y, x) in remaining - still_remaining:
            opaque[y, x] = True
        remaining = still_remaining


def process(path: Path, max_hole_size: int, dry_run: bool) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[..., :3].copy()
    alpha = arr[..., 3].copy()

    components = find_interior_components(alpha)
    to_fill = [c for c in components if len(c) <= max_hole_size]
    skipped = [c for c in components if len(c) > max_hole_size]

    filled_px = sum(len(c) for c in to_fill)
    if not to_fill:
        status = "нет дырок" if not components else f"пропущено {len(skipped)} крупных (не артефакт)"
        print(f"{path}: {status}")
        return

    print(f"{path}: закрашено {len(to_fill)} дырок ({filled_px}px)"
          + (f", пропущено {len(skipped)} крупных" if skipped else ""))

    if dry_run:
        return

    holes = [px for c in to_fill for px in c]
    fill_holes(rgb, alpha, holes)
    out = np.dstack([rgb, alpha])
    Image.fromarray(out, mode="RGBA").save(path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", help="glob входных файлов")
    ap.add_argument("--max-hole-size", type=int, default=64,
                     help="макс. размер компоненты-артефакта в пикселях (по умолч. 64)")
    ap.add_argument("--dry-run", action="store_true", help="только отчёт, файлы не менять")
    args = ap.parse_args()

    paths = sorted(Path(p) for p in glob.glob(args.input, recursive=True))
    if not paths:
        ap.error(f"по glob '{args.input}' ничего не найдено")

    for path in paths:
        process(path, args.max_hole_size, args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
