# Промпт: Костёр (анимированное пламя)

Анимированное пламя поверх статичного кострища. Фон лагеря без огня — `public/backgrounds/camp.2.png`
(в центре остались поленья, угли и тёплое световое пятно на земле). Пламя — отдельный
зацикленный спрайт-лист, рисуется **поверх** поленьев.

## Инструмент

Весь арт проекта **всегда** генерируется через **Nano Banana** (Gemini image) — естественным
языком, без флагов Midjourney (`--ar`, `--style`, `--v`, `--q`, `--no`). «Негатив» пишем прозой.

## Технические параметры

| Параметр              | Значение                                                              |
|-----------------------|-----------------------------------------------------------------------|
| Тип                   | горизонтальный спрайт-лист, один ряд кадров                            |
| Число кадров          | **6** (зацикленная петля: кадр 6 → кадр 1 без рывка)                  |
| Раскладка             | 6 кадров в ряд, одинаковый размер ячейки, ~256×256 на кадр (≈1536×256) |
| Позиция в лагере      | основание пламени ≈ x652, y620 (игровые коорд., поверх поленьев)      |
| Отрисовка в коде      | подбирается под размер поленьев, ~150×190 (твик в сцене)             |
| Путь                  | `public/sprites/camp/campfire.png`                                   |
| Ключ текстуры         | `camp-fire`                                                          |
| Фон                   | прозрачный (PNG с альфой), без сцены, без поленьев и камней           |

## Что рисуем

**Только языки пламени** + лёгкое свечение углей у основания. Поленья, камни кострища и
подсвет земли уже есть на `camp.2.png` — их рисовать НЕ нужно, иначе будет двойной костёр.
Каждый кадр — одна и та же высота/ширина ячейки, основание пламени строго на одном месте
(не «прыгает» между кадрами), меняется только форма языков: чуть колышется, отрываются
мелкие искры/угольки, разная высота центрального языка. Кадры идут плавной фазой, чтобы
6-й стыковался с 1-м в бесшовную петлю.

**Свет/палитра:** костёр — единственный допустимый тёплый акцент в мрачной сцене. Глубокий
оранжево-янтарный с тёплой жёлто-белой сердцевиной и тёмно-красным у основания; НЕ
неоновый, НЕ кислотный, без чистого жёлтого. Тон должен совпадать с пламенем на исходном
`camp.png` — тёплый, но приглушённый, в духе тёмного фэнтези.

## Консистентность

Генерировать в **режиме редактирования**: приложить `public/backgrounds/camp.png` (там виден
оригинальный костёр) как эталон цвета, температуры и пиксель-стиля пламени. В промпте просить
повторить ровно тот же стиль и палитру огня.

## Промпт — спрайт-лист (Nano Banana)

```
Using the attached dark-fantasy pixel-art camp scene as the EXACT reference for the
campfire's art style, color temperature and palette, generate a horizontal sprite
sheet of a looping campfire FLAME animation — flames ONLY, on a fully transparent
background.

Layout: a single horizontal row of 6 equal-size frames (about 256x256 px each, sheet
roughly 1536x256). Each frame shows the same fire from the same angle, with the base
of the flames pinned to the exact same spot near the bottom-center of every frame —
the base must NOT drift or jump between frames. From frame to frame only the flame
shape changes: the tongues of fire sway and flicker, the central tongue rises and
falls to different heights, and a few small sparks / embers lift off. Make it a
seamless loop so frame 6 flows back into frame 1 without a jump.

Draw ONLY the flames plus a faint warm glow of embers at their base. Do NOT draw logs,
firewood, stones, a fire ring, the ground, or any light pool on the floor — those
already exist in the scene. Everything except the flames and their immediate glow must
be fully transparent.

Color: the campfire is the one warm accent in an otherwise grim, desaturated scene.
Deep amber-orange flames with a warm yellow-white core and dark red roots at the base,
matching the fire in the attached image. Keep it warm but muted and painterly — NOT
neon, NOT acid-bright, no pure flat yellow. Hand-crafted pixel-art rendering, same
pixel style and outline feel as the reference.

Not cartoon, not anime, not 3D render. Fully transparent background, output PNG with
alpha channel. No scenery, no logs, no stones, no ground, no sky, no UI, no text, no
frames, no logos. Just the 6-frame flame strip.
```

## Цветовые ориентиры

Тёплый акцент в холодной сцене — как пламя на исходном `camp.png`:

- Сердцевина: тёплый жёлто-белый (#ffe6a0 / #ffcf6b)
- Тело пламени: янтарно-оранжевый (#ff9a3c / #e8631f)
- Основание/корни: тёмно-красный, тлеющий уголь (#8a2410 / #5a1808)
- Искры: тусклые оранжевые точки, быстро гаснут
- Без холодных тонов, без чистого неонового жёлтого

## Риск спрайт-листа

Генеративная модель **плохо держит ровную раскладку и регистрацию кадров** — кадры могут
поехать по размеру/позиции, основание пламени «прыгнуть», шаг между кадрами получиться
неравномерным. Это ожидаемо и правится **руками в Aseprite** (выровнять кадры по сетке,
зафиксировать основание, почистить ореолы альфы). Запасные пути:

- Если ровный лист не выходит — генерировать кадры **по одному** одинаковым промптом
  (варьируя только высоту/форму языков) и собирать лист в Aseprite.
- Если прозрачный фон выйдет грязным — просить сплошную магенту `#FF00FF` фоном и резать:
  `python tools/chroma_key.py in.png out.png`.
