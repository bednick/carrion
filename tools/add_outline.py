#!/usr/bin/env python3
"""
Add outline: обводит непрозрачный силуэт спрайта 1px чёрной (opaque) каёмкой снаружи —
воспроизводит Aseprite FX → Outline (Place: Outside, Matrix: Square, толщина 1, цвет чёрный).

"Square" = 8-связность (включая диагонали): каждый прозрачный пиксель, у которого среди
8 соседей есть непрозрачный, становится чёрным. Проверено сверкой с bound_corpse/base.png и
armed_marauder/base.png (обведены вручную в Aseprite тем же FX) — там присутствуют угловые
пиксели, соприкасающиеся с силуэтом только по диагонали, что подтверждает именно 8-связность,
не 4 (crest/circle).

Идемпотентность: скрипт наращивает ещё одно кольцо от ТЕКУЩЕГО непрозрачного силуэта, поэтому
на уже обведённом файле повторный запуск нарастит вторую обводку поверх первой — файлы, где
обводка уже сделана руками (bound_corpse, armed_marauder), в него не передавать.

Зависимости: pip install pillow numpy

Аргументы:
  input                 glob входных файлов
  --dry-run             только отчёт (сколько пикселей добавлено), файлы не менять

Примеры:
  python tools/add_outline.py 'public/sprites/mobs/*/base.png' --dry-run
  python tools/add_outline.py 'public/sprites/mobs/*/base.png'
"""
import argparse
import glob
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Нужны зависимости: pip install pillow numpy")

OUTLINE_RGB = (0, 0, 0)


def dilate8(mask: np.ndarray) -> np.ndarray:
    """Булева маска, раздутая на 1px по всем 8 направлениям (square-матрица)."""
    h, w = mask.shape
    padded = np.pad(mask, 1, mode="constant", constant_values=False)
    result = np.zeros_like(mask)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy == 0 and dx == 0:
                continue
            result |= padded[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
    return result


def process(path: Path, dry_run: bool) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[..., :3]
    alpha = arr[..., 3]
    opaque = alpha > 0

    outline = dilate8(opaque) & ~opaque
    added = int(outline.sum())
    print(f"{path}: +{added}px обводки")
    if dry_run or added == 0:
        return

    rgb[outline] = OUTLINE_RGB
    alpha[outline] = 255
    Image.fromarray(arr, mode="RGBA").save(path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", help="glob входных файлов")
    ap.add_argument("--dry-run", action="store_true", help="только отчёт, файлы не менять")
    args = ap.parse_args()

    paths = sorted(Path(p) for p in glob.glob(args.input, recursive=True))
    if not paths:
        ap.error(f"по glob '{args.input}' ничего не найдено")

    for path in paths:
        process(path, args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
