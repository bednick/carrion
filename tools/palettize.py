#!/usr/bin/env python3
"""
Palettize: уменьшает картинку до пиксель-артного вида — квантование в N цветов (или в готовую
палитру) + опциональный k-centroid даунскейл + апскейл обратно ближайшим соседом (жёсткие
пиксельные грани), с опциональным упорядоченным (Bayer) дизерингом.

Портировано (без Automatic1111/Gradio/cv2-обвязки) из Astropulse/sd-palettize
(https://github.com/Astropulse/sd-palettize, отдельной лицензии в репозитории нет — код открыт,
но без явного LICENSE-файла).

Байер-дизеринг (построение матрицы + подбор ближайшего цвета палитры) реализован самостоятельно
по мотивам hitherdither (https://github.com/hbldh/hitherdither, автор Henrik Blidh, MIT license) —
вместо git-зависимости `pip install git+https://github.com/hbldh/hitherdither`, которая ломает
конвенцию "pip install <имя>" этого репозитория. Алгоритм (рекурсивная Bayer-матрица, нормировка
(1+I(n))/(1+n²), L2-подбор ближайшего цвета) идентичен оригиналу hitherdither.

В отличие от оригинала (SD генерит непрозрачные картинки), здесь альфа-канал явно сохраняется
через весь пайплайн: спрайты этого проекта — прозрачный пиксель-арт (см. docs/art-spec.md).

Зависимости: pip install pillow numpy

Примеры:
  python tools/palettize.py in.png out.png --palette pico-8
  python tools/palettize.py in.png out.png --colors 16 --dither-strength 4
  python tools/palettize.py in.png out.png --palette auto --scale 4
  python tools/palettize.py in.png out.png --palette my-palette.png --no-kcentroid --native-size
  python tools/palettize.py --list-palettes
"""
import argparse
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Нужны зависимости: pip install pillow numpy")

PALETTES_DIR = Path(__file__).resolve().parent / "palettes"
MAX_K = 64
KCENTROID_CENTROIDS = 2
DEFAULT_DITHER_ORDER = 8


# --- палитры -----------------------------------------------------------

def list_bundled_palettes() -> list[str]:
    return sorted(p.stem for p in PALETTES_DIR.glob("*.png"))


def resolve_palette_arg(value: str, ap: argparse.ArgumentParser) -> Path | None:
    """"auto" -> None (сигнал автоматического режима); путь к файлу -> как есть;
    иначе -> tools/palettes/<value>.png."""
    if value == "auto":
        return None
    custom = Path(value)
    if custom.is_file():
        return custom
    preset = PALETTES_DIR / f"{value}.png"
    if preset.is_file():
        return preset
    available = ", ".join(list_bundled_palettes())
    ap.error(f"палитра '{value}' не найдена. Встроенные: {available}")


def palette_colors_from_image(pal_img: Image.Image, warn_threshold: int = 512) -> list[tuple[int, int, int]]:
    colors = pal_img.convert("RGB").getcolors(16777216)
    if colors is None:
        colors = []
    if len(colors) > warn_threshold:
        print(f"предупреждение: в палитре {len(colors)} уникальных цветов — похоже на фото, "
              f"а не на палитру, будет медленно", file=sys.stderr)
    return [c for _, c in colors]


# --- даунскейл -----------------------------------------------------------

def kcentroid_downscale(img: Image.Image, width: int, height: int,
                         centroids: int = KCENTROID_CENTROIDS) -> Image.Image:
    """На каждый целевой пиксель — тайл источника, квантованный в `centroids` цветов, из которого
    берётся самый частый результирующий цвет."""
    w_factor = img.width / width
    h_factor = img.height / height
    out = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        for x in range(width):
            tile = img.crop((
                x * w_factor, y * h_factor,
                (x + 1) * w_factor, (y + 1) * h_factor,
            )).quantize(colors=centroids, method=1, kmeans=centroids).convert("RGB")
            counts = tile.getcolors(16777216)
            most_common = max(counts, key=lambda c: c[0])[1]
            out[y, x, :] = most_common
    return Image.fromarray(out, mode="RGB")


def plain_downscale(img: Image.Image, width: int, height: int) -> Image.Image:
    return img.resize((width, height), Image.BILINEAR)


# --- гамма -----------------------------------------------------------------

def gamma_lut(gamma: float) -> list[int]:
    lut = [int((i / 255.0) ** (1.0 / gamma) * 255.0 + 0.5) for i in range(256)]
    lut = [min(255, max(0, v)) for v in lut]
    return lut * 3


def adjust_gamma(img: Image.Image, gamma: float) -> Image.Image:
    return img.point(gamma_lut(gamma))


# --- Bayer-дизеринг (своя реализация, см. докстринг про hitherdither) -----

def bayer_index_matrix(n: int) -> np.ndarray:
    if n == 2:
        return np.array([[0, 2], [3, 1]], dtype=int)
    smaller = bayer_index_matrix(n >> 1)
    top = np.hstack([4 * smaller, 4 * smaller + 2])
    bottom = np.hstack([4 * smaller + 3, 4 * smaller + 1])
    return np.vstack([top, bottom])


def bayer_matrix(n: int) -> np.ndarray:
    return (1 + bayer_index_matrix(n)) / (1 + n * n)


def nearest_palette_color(rgb: np.ndarray, palette: np.ndarray) -> np.ndarray:
    """rgb: (H,W,3) float (может быть смещён Байером за пределы 0..255 — это нормально, не клэмпить).
    palette: (P,3). Возвращает (H,W,3) uint8 — ближайший по L2 цвет палитры на пиксель."""
    h, w, _ = rgb.shape
    best_dist = np.full((h, w), np.inf, dtype=np.float64)
    best_color = np.zeros((h, w, 3), dtype=np.uint8)
    for color in palette:
        diff = rgb - color
        dist = np.einsum("ijk,ijk->ij", diff, diff)
        mask = dist < best_dist
        best_dist = np.where(mask, dist, best_dist)
        best_color[mask] = color
    return best_color


def bayer_dither_to_palette(rgb_img: Image.Image, palette: list[tuple[int, int, int]],
                             threshold: float, order: int) -> Image.Image:
    matrix = bayer_matrix(order)
    arr = np.asarray(rgb_img, dtype=np.float64)
    h, w, _ = arr.shape
    yy, xx = np.meshgrid(np.arange(h) % order, np.arange(w) % order, indexing="ij")
    bias = matrix[yy, xx] * threshold
    biased = arr + bias[..., None]
    result = nearest_palette_color(biased, np.array(palette, dtype=np.float64))
    return Image.fromarray(result, mode="RGB")


# --- Automatic (метод локтя) ------------------------------------------------

def determine_best_k(img: Image.Image, max_k: int = MAX_K) -> int:
    pixels = np.asarray(img.convert("RGB"), dtype=np.float64).reshape(-1, 3)
    distortions = []
    for k in range(1, max_k + 1):
        quantized = img.quantize(colors=k, method=2, kmeans=k, dither=0)
        centroids = np.array(quantized.getpalette()[:k * 3], dtype=np.float64).reshape(-1, 3)
        distances = np.linalg.norm(pixels[:, np.newaxis] - centroids, axis=2)
        min_distances = np.min(distances, axis=1)
        distortions.append(np.sum(min_distances ** 2))
    distortions = np.array(distortions)
    rate_of_change = np.diff(distortions) / distortions[:-1]
    if len(rate_of_change) == 0:
        return 2
    elbow_index = int(np.argmax(rate_of_change)) + 1
    return elbow_index + 2


def build_automatic_palette(img: Image.Image, max_k: int = MAX_K) -> Image.Image:
    best_k = determine_best_k(img, max_k)
    return img.quantize(colors=best_k, method=1, kmeans=best_k, dither=0).convert("RGB")


# --- оркестрация квантования/дизеринга -------------------------------------

def palettize(img: Image.Image, colors: int, palette_img: Image.Image | None,
              dither_order: int | None, dither_strength: int) -> Image.Image:
    order = dither_order or DEFAULT_DITHER_ORDER
    threshold = 4 * dither_strength

    if palette_img is not None:
        palette = palette_colors_from_image(palette_img)
        if dither_strength > 0:
            gamma_img = adjust_gamma(img, 1.0 - 0.02 * dither_strength)
            return bayer_dither_to_palette(gamma_img, palette, threshold, order)
        pal_p_img = Image.new("P", (256, 1))
        pal_p_img.putpalette([c for rgb in palette for c in rgb])
        return img.quantize(palette=pal_p_img, dither=0).convert("RGB")

    if dither_strength > 0:
        base = img.quantize(colors=colors, method=1, kmeans=colors, dither=0)
        palette = palette_colors_from_image(base.convert("RGB"))
        gamma_img = adjust_gamma(img, 1.0 - 0.03 * dither_strength)
        return bayer_dither_to_palette(gamma_img, palette, threshold, order)
    return img.quantize(colors=colors, method=1, kmeans=colors, dither=0).convert("RGB")


# --- CLI ---------------------------------------------------------------

def build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        description="Уменьшает картинку до пиксель-артного вида (квантование + опц. дизеринг)")
    ap.add_argument("input", nargs="?", help="входное изображение (любой формат, читаемый Pillow)")
    ap.add_argument("output", nargs="?", help="куда сохранить результат (формат по расширению)")

    ap.add_argument("--colors", type=int, default=None,
                     help="целевое кол-во цветов свободного k-means, 2-128 (по умолч. 24); "
                          "несовместимо с --palette")
    ap.add_argument("--palette", default=None,
                     help="имя встроенной палитры (см. --list-palettes), путь к своей PNG-палитре, "
                          "либо 'auto' — автоподбор числа цветов методом локтя")

    ap.add_argument("--no-downscale", dest="downscale", action="store_false", default=True,
                     help="не уменьшать перед палетизацией (по умолч. уменьшение включено)")
    ap.add_argument("--scale", type=int, default=8,
                     help="делитель даунскейла, 2-32 (по умолч. 8)")
    ap.add_argument("--no-kcentroid", dest="kcentroid", action="store_false", default=True,
                     help="даунскейл простым билинейным ресайзом вместо K-Centroid "
                          "(по умолч. K-Centroid включён)")

    ap.add_argument("--dither", type=int, choices=(2, 4, 8), default=None,
                     help="порядок матрицы Байера: 2/4/8 = Bayer 2x2/4x4/8x8 "
                          "(без --dither-strength не действует; если --dither-strength задан, "
                          "а --dither нет — используется 8, как в оригинале)")
    ap.add_argument("--dither-strength", type=int, default=0,
                     help="сила дизеринга, 0-10 (по умолч. 0 = дизеринг выключен независимо от --dither)")

    ap.add_argument("--native-size", action="store_true",
                     help="сохранить в уменьшенном (нативном) разрешении вместо апскейла обратно")
    ap.add_argument("--list-palettes", action="store_true",
                     help="напечатать список встроенных палитр и выйти")
    return ap


def main() -> int:
    ap = build_arg_parser()
    args = ap.parse_args()

    if args.list_palettes:
        for name in list_bundled_palettes():
            print(name)
        return 0

    if not args.input or not args.output:
        ap.error("input и output обязательны (кроме --list-palettes)")
    if args.palette and args.colors is not None:
        ap.error("--colors и --palette взаимоисключающие — --colors влияет только на свободный k-means")
    if not (2 <= args.scale <= 32):
        ap.error("--scale должен быть в диапазоне 2-32")
    if not (0 <= args.dither_strength <= 10):
        ap.error("--dither-strength должен быть в диапазоне 0-10")
    colors = args.colors if args.colors is not None else 24
    if not (2 <= colors <= 128):
        ap.error("--colors должен быть в диапазоне 2-128")
    if args.dither is not None and args.dither_strength == 0:
        print("предупреждение: --dither без --dither-strength не действует", file=sys.stderr)

    img = Image.open(args.input).convert("RGBA")
    rgb_arr = np.asarray(img.convert("RGB"))
    alpha = img.getchannel("A")
    alpha_arr = np.asarray(alpha)
    rgb_arr = np.where(alpha_arr[..., None] == 0, 0, rgb_arr).astype(np.uint8)
    rgb = Image.fromarray(rgb_arr, "RGB")
    orig_w, orig_h = rgb.size

    if args.downscale:
        dw = max(1, round(orig_w / args.scale))
        dh = max(1, round(orig_h / args.scale))
        rgb = kcentroid_downscale(rgb, dw, dh) if args.kcentroid else plain_downscale(rgb, dw, dh)
        alpha = alpha.resize((dw, dh), Image.NEAREST)

    palette_img = None
    if args.palette:
        resolved = resolve_palette_arg(args.palette, ap)
        palette_img = build_automatic_palette(rgb) if resolved is None else Image.open(resolved).convert("RGB")

    result_rgb = palettize(rgb, colors, palette_img, args.dither, args.dither_strength)

    if args.downscale and not args.native_size:
        up_w, up_h = result_rgb.width * args.scale, result_rgb.height * args.scale
        result_rgb = result_rgb.resize((up_w, up_h), Image.NEAREST)
        alpha = alpha.resize((up_w, up_h), Image.NEAREST)
        if (up_w, up_h) != (orig_w, orig_h):
            print(f"примечание: итоговый размер {up_w}x{up_h} отличается от входного "
                  f"{orig_w}x{orig_h} — scale={args.scale} не делит размеры нацело", file=sys.stderr)

    out = Image.merge("RGBA", (*result_rgb.split(), alpha))
    out.save(args.output)
    print(f"OK: {args.output}  {out.width}x{out.height}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
