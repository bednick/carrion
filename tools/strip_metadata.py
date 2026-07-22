#!/usr/bin/env python3
"""
Вычищает метаданные из картинок проекта (PNG + SVG), не трогая изображение.

PNG правится **посегментно, без перекодирования**: файл разбирается на чанки, лишние
выбрасываются, оставшиеся пишутся байт в байт. Пиксельные данные (IDAT) не пересжимаются,
поэтому картинка не может «поплыть».

Что режется у PNG по умолчанию (то, что и есть метаданные):
    tEXt zTXt iTXt  — текстовые комментарии (Software, parameters, Comment, XML:com.adobe...)
    eXIf            — EXIF-блок
    tIME            — время последней правки
    pHYs            — физическое разрешение (DPI)
    bKGD sBIT hIST sPLT — вспомогательные подсказки рендереру

Что остаётся всегда: IHDR PLTE IDAT IEND + tRNS (прозрачность палитровых PNG — без него
картинка потеряет альфу).

Цветовые чанки (gAMA cHRM sRGB iCCP) по умолчанию НЕ трогаются: их удаление может сдвинуть
цвет в браузере. Убрать их — флагом --strip-color.

SVG чистится консервативно: XML-комментарии, блок <metadata>, <sodipodi:namedview>, атрибуты
и объявления пространств имён редакторов (inkscape:, sodipodi:). Геометрия и стили не трогаются.

Зависимости: только стандартная библиотека. Pillow (если стоит) используется для проверки,
что PNG после правки декодируется в те же пиксели.

Примеры:
    python tools/strip_metadata.py --dry-run          # показать, что будет вырезано
    python tools/strip_metadata.py                    # почистить весь репозиторий
    python tools/strip_metadata.py public/sprites     # только один каталог
    python tools/strip_metadata.py --strip-color      # + выкинуть цветовые профили
"""
import argparse
import re
import struct
import sys
from pathlib import Path

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

# Обязательные чанки + прозрачность — не трогаем никогда.
KEEP_ALWAYS = {b"IHDR", b"PLTE", b"IDAT", b"IEND", b"tRNS"}
# Цветовые чанки — режем только по флагу.
COLOR_CHUNKS = {b"gAMA", b"cHRM", b"sRGB", b"iCCP"}

SKIP_DIRS = {".git", "node_modules", "dist", ".vite", "build"}

# --- SVG ---------------------------------------------------------------------

RE_XML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
RE_METADATA = re.compile(r"<metadata\b.*?</metadata\s*>", re.DOTALL | re.IGNORECASE)
RE_NAMEDVIEW = re.compile(r"<sodipodi:namedview\b.*?(?:/>|</sodipodi:namedview\s*>)", re.DOTALL)
RE_EDITOR_ATTR = re.compile(r'\s+(?:inkscape|sodipodi):[\w-]+\s*=\s*"[^"]*"')
RE_EDITOR_NS = re.compile(r'\s+xmlns:(?:inkscape|sodipodi)\s*=\s*"[^"]*"')


def iter_chunks(data: bytes):
    """Итератор по чанкам PNG: (тип, полные байты чанка вместе с длиной и CRC)."""
    offset = len(PNG_SIGNATURE)
    while offset < len(data):
        if offset + 8 > len(data):
            raise ValueError(f"обрезанный чанк на позиции {offset}")
        (length,) = struct.unpack(">I", data[offset:offset + 4])
        chunk_type = data[offset + 4:offset + 8]
        end = offset + 12 + length  # 4 длина + 4 тип + данные + 4 CRC
        if end > len(data):
            raise ValueError(f"чанк {chunk_type!r} выходит за границу файла")
        yield chunk_type, data[offset:end]
        offset = end
        if chunk_type == b"IEND":
            break


def clean_png(data: bytes, strip_color: bool):
    """Возвращает (новые байты, список вырезанных типов чанков)."""
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError("не PNG (нет сигнатуры)")

    keep = set(KEEP_ALWAYS)
    if not strip_color:
        keep |= COLOR_CHUNKS

    out = [PNG_SIGNATURE]
    dropped = []
    for chunk_type, raw in iter_chunks(data):
        if chunk_type in keep:
            out.append(raw)
        else:
            dropped.append(chunk_type.decode("ascii", "replace"))
    return b"".join(out), dropped


def pixels_match(before: bytes, after: bytes) -> bool:
    """Проверка через Pillow, что картинка декодируется в те же пиксели. Нет Pillow — пропуск."""
    try:
        import io

        from PIL import Image
    except ImportError:
        return True
    with Image.open(io.BytesIO(before)) as a, Image.open(io.BytesIO(after)) as b:
        if a.size != b.size:
            return False
        return a.convert("RGBA").tobytes() == b.convert("RGBA").tobytes()


def clean_svg(text: str):
    """Возвращает (новый текст, список того, что вырезано)."""
    dropped = []
    for label, pattern in (
        ("comment", RE_XML_COMMENT),
        ("metadata", RE_METADATA),
        ("namedview", RE_NAMEDVIEW),
        ("editor-attr", RE_EDITOR_ATTR),
        ("editor-ns", RE_EDITOR_NS),
    ):
        text, count = pattern.subn("", text)
        if count:
            dropped.append(f"{label} x{count}")
    return text, dropped


def iter_targets(roots):
    for root in roots:
        if root.is_file():
            yield root
            continue
        for path in sorted(root.rglob("*")):
            if not path.is_file():
                continue
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            if path.suffix.lower() in (".png", ".svg"):
                yield path


def main() -> int:
    # Windows-консоль по умолчанию в cp1251 — иначе кириллица в выводе падает.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

    parser = argparse.ArgumentParser(description="Вычистить метаданные из PNG и SVG проекта.")
    parser.add_argument("paths", nargs="*", default=None,
                        help="файлы или каталоги (по умолчанию — корень репозитория)")
    parser.add_argument("--dry-run", action="store_true",
                        help="только показать, что будет вырезано; файлы не трогать")
    parser.add_argument("--strip-color", action="store_true",
                        help="дополнительно выкинуть gAMA/cHRM/sRGB/iCCP (может сдвинуть цвет)")
    parser.add_argument("--svg", dest="svg", action="store_true", default=True,
                        help="чистить SVG (включено по умолчанию)")
    parser.add_argument("--no-svg", dest="svg", action="store_false",
                        help="не трогать SVG")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    roots = [Path(p).resolve() for p in args.paths] if args.paths else [repo_root]

    touched = 0
    scanned = 0
    saved = 0
    failed = 0

    for path in iter_targets(roots):
        if path.suffix.lower() == ".svg" and not args.svg:
            continue
        scanned += 1
        rel = path.relative_to(repo_root) if repo_root in path.parents else path

        try:
            if path.suffix.lower() == ".png":
                original = path.read_bytes()
                cleaned, dropped = clean_png(original, args.strip_color)
                if not dropped:
                    continue
                if not pixels_match(original, cleaned):
                    print(f"!! {rel}: пиксели не совпали после чистки — файл пропущен")
                    failed += 1
                    continue
                delta = len(original) - len(cleaned)
                print(f"{'[dry] ' if args.dry_run else ''}{rel}: -{delta} B  ({', '.join(dropped)})")
                if not args.dry_run:
                    path.write_bytes(cleaned)
            else:
                original_text = path.read_text(encoding="utf-8")
                cleaned_text, dropped = clean_svg(original_text)
                if not dropped:
                    continue
                delta = len(original_text.encode("utf-8")) - len(cleaned_text.encode("utf-8"))
                print(f"{'[dry] ' if args.dry_run else ''}{rel}: -{delta} B  ({', '.join(dropped)})")
                if not args.dry_run:
                    path.write_text(cleaned_text, encoding="utf-8")
            touched += 1
            saved += delta
        except (OSError, ValueError, UnicodeDecodeError) as exc:
            print(f"!! {rel}: {exc}")
            failed += 1

    verb = "нашлось" if args.dry_run else "почищено"
    print(f"\nПросмотрено {scanned}, {verb} {touched}, освобождено {saved} B, ошибок {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
