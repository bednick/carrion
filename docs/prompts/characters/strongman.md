# Промпт: Силач (Strongman)

## Технические параметры

| Параметр                | Значение                                             |
|-------------------------|------------------------------------------------------|
| Спрайт лагеря           | **300×600 px** (стоп-кадр, transparent PNG)          |
| Кадр боевой анимации    | 64×96 px (единый шаблон, см. art-spec.md)            |
| Attachment points (бой) | голова (32,18) · руки (10,48)/(54,48) · ноги (32,72) |
| Bottom-center в лагере  | (560, 600)                                           |

## Описание персонажа

Силач — здоровый, приземистый боец с выраженной мускулатурой.
Не рыцарь и не маг — прагматичный мародёр, который берёт силой.
Одет в слоёную грубую броню: кожаные пластины, намотанные бинты на руках, тяжёлые сапоги.
Вооружён широкой дубиной или двуручной секирой — чем-то тяжёлым.
Лицо грубое, шрамированное. Возможна бандана или потрёпанный капюшон.
Тёмное фэнтези, без мультяшности и аниме.

---

## Генерация (Nano Banana)

Промпты ниже — натуральные инструкции под **Nano Banana** (НЕ Midjourney), без флагов.

**Порядок и консистентность:**

1. Сначала генерим **камп-спрайт** (`camp.png`) — он задаёт эталонный облик персонажа.
2. Затем генерим **боевой `idle`**, прикладывая `camp.png` как референс — он становится каноном для боевых кадров.
3. Остальные боевые анимации (`walk/attack/hit/block/death`) генерим **в режиме редактирования**, прикладывая
   `idle.png` как эталон — тот же силуэт, броня, цвета, пропорции, пиксель-стиль и **тот же масштаб/базовая линия ног**.

**Прозрачность.** Просим явно прозрачный фон с альфой. Если альфа не выходит — запасной путь: просим сплошной фон
**магента `#FF00FF`** и режем `python tools/chroma_key.py in.png out.png`.

---

## Лагерь — стоп-кадр

В лагере Силач стоит у костра — расслабленная поза, оружие убрано или воткнуто рядом.

### Спрайт лагеря (300×600 px)

```
Pixel art single character sprite for a grim dark fantasy RPG, hand-crafted pixel style.
Subject: the Strongman — a heavily built, short and stocky scarred brawler with pronounced
muscles, a pragmatic marauder who takes by force (not a knight, not a mage). He wears layered
rough armor: dark leather plates, dirty bandage wraps around his forearms, heavy boots, and a
bandana or tattered hood. His face is coarse and scarred. A wide club or heavy two-handed axe is
holstered on his back or stuck in the ground leaning beside him.
Pose: relaxed standing pose near a campfire, arms resting, weapon holstered or leaning beside him.
Full body visible from head to toe, centered, slightly turned toward the viewer.
Lighting: warm firelight glow from the lower left, otherwise a dark muted palette.
Output a single still frame in a tall portrait format, about 300x600 pixels (1:2).
Fully transparent background — output a PNG with an alpha channel. No scenery, no ground plate,
no cast shadow.
Do not include: any background or scenery, text, UI, frames, bright saturated colors, cartoon or
anime styling, magic glow, 3D render.
```

---

## Бой — полный набор анимаций

В бою Силач агрессивен: тяжёлая стойка, удары с размахом.
Свет нейтральный или холодный (зона боя, не лагерь).
Каждая анимация — один горизонтальный ряд кадров, прозрачный фон, единый масштаб и базовая линия ног во всех кадрах.

### idle — боевая стойка (6 кадров, 384×96 px)

> Эталон для остальных боевых кадров. Приложить `camp.png` как референс облика.

```
Pixel art combat animation sprite sheet for a grim dark fantasy RPG, hand-crafted pixel style.
Use the Strongman from the attached reference image as the exact canonical model — same silhouette,
layered leather armor, bandaged forearms, scarred face, colors, proportions and pixel style.
Layout: a single horizontal strip of 6 frames in one row, evenly spaced, each frame exactly
64x96 pixels, the character at identical scale and vertically aligned with feet on the same
baseline in every frame.
Action: a low ready combat stance holding a heavy axe or mace, with subtle breathing and a slight
weapon sway between frames — a short seamless loop.
Lighting: cold neutral ambient light (battle zone, not a campfire).
Fully transparent background — output a PNG with an alpha channel.
Do not include: background, ground, text, UI, multiple rows, frame borders or grid lines, bright
colors, cartoon or anime, 3D render.
```

### walk — ходьба (8 кадров, 512×96 px)

Строгий профиль (вид сбоку), герой обращён ВПРАВО и шагает вправо. Ноги читаются раздельно, руки качаются
в противофазу к ногам. Тяжёлая, грузная поступь силача. Покадровая раскадровка одного полного цикла (две
поступи: правая, затем левая):

| Кадр | Ноги                                                                                          | Тело               |
|------|-----------------------------------------------------------------------------------------------|--------------------|
| 1    | ноги вместе под корпусом (проходная поза), стопы рядом                                        | нейтральная высота |
| 2    | правая нога выносится вперёд (пятка тянется вперёд), левая позади опорная                     | корпус приподнят   |
| 3    | правая стопа ставится впереди (контакт пяткой), ноги широко, левая на носке сзади             | корпус ниже всего  |
| 4    | вес переносится на правую, левая нога отрывается и подтягивается, ноги сближаются             | корпус поднимается |
| 5    | ноги снова вместе под корпусом (проходная поза, зеркально к кадру 1)                          | нейтральная высота |
| 6    | левая нога выносится вперёд, правая позади опорная                                            | корпус приподнят   |
| 7    | левая стопа ставится впереди (контакт пяткой), ноги широко, правая на носке сзади             | корпус ниже всего  |
| 8    | вес на левой, правая нога отрывается и подтягивается вперёд, ноги сближаются → петля в кадр 1 | корпус поднимается |

```
Pixel art walk-cycle animation sprite sheet for a grim dark fantasy RPG, hand-crafted pixel style.
Use the Strongman from the attached reference image as the exact canonical model — same silhouette,
armor, colors, proportions and pixel style.
Layout: a single horizontal strip of 8 frames in one row, evenly spaced, each frame exactly
64x96 pixels, the character at identical scale and feet on the same baseline in every frame.
View: strict side profile (the character is seen from the side, facing right and walking to the
right), full body visible, both legs clearly separated and readable, a weapon held in one hand.
Action: a heavy, weighty walk cycle with a deliberate gait. Arms swing in opposition to the legs.
The eight frames form one full looping cycle (a right step then a left step), with the legs posed
exactly as follows:
Frame 1: legs together under the body (passing pose), feet close side by side, body at neutral height.
Frame 2: the right leg swings forward (heel reaching ahead), the left leg stays planted behind, body lifting.
Frame 3: the right foot plants down in front (heel contact), legs spread wide apart, the left foot trailing on its toe, body at its lowest.
Frame 4: weight shifts onto the right foot, the left leg lifts off and is pulled forward, legs closing together, body rising.
Frame 5: legs together under the body again (passing pose, mirror of frame 1), body at neutral height.
Frame 6: the left leg swings forward, the right leg stays planted behind, body lifting.
Frame 7: the left foot plants down in front (heel contact), legs spread wide apart, the right foot trailing on its toe, body at its lowest.
Frame 8: weight shifts onto the left foot, the right leg lifts off and is pulled forward, legs closing, body rising — loops back to frame 1.
Lighting: cold neutral ambient light.
Fully transparent background — output a PNG with an alpha channel.
Do not include: background, ground, text, UI, multiple rows, frame borders or grid lines, bright
colors, cartoon or anime, 3D render, front-facing or three-quarter view.
```

### attack — удар (6 кадров, 384×96 px)

```
Pixel art attack animation sprite sheet for a grim dark fantasy RPG, hand-crafted pixel style.
Use the Strongman from the attached reference image as the exact canonical model — same silhouette,
armor, colors, proportions and pixel style.
Layout: a single horizontal strip of 6 frames in one row, evenly spaced, each frame exactly
64x96 pixels, the character at identical scale and feet on the same baseline in every frame.
Action: a wide heavy overhead or side swing with an axe or mace, progressing across the frames as
windup, full swing, follow-through, recovery, with exaggerated weight and momentum.
Lighting: cold neutral ambient light.
Fully transparent background — output a PNG with an alpha channel.
Do not include: background, ground, text, UI, multiple rows, frame borders or grid lines, bright
colors, cartoon or anime, 3D render.
```

### hit — получение урона (3 кадра, 192×96 px)

```
Pixel art hit-reaction animation sprite sheet for a grim dark fantasy RPG, hand-crafted pixel style.
Use the Strongman from the attached reference image as the exact canonical model — same silhouette,
armor, colors, proportions and pixel style.
Layout: a single horizontal strip of 3 frames in one row, evenly spaced, each frame exactly
64x96 pixels, the character at identical scale and feet on the same baseline in every frame.
Action: staggered by a blow, head snapping back and body recoiling, a brief flash of pain but
resolute, returning toward stance.
Lighting: cold neutral ambient light.
Fully transparent background — output a PNG with an alpha channel.
Do not include: background, ground, text, UI, multiple rows, frame borders or grid lines, bright
colors, cartoon or anime, 3D render.
```

### block — блок (3 кадра, 192×96 px)

```
Pixel art block animation sprite sheet for a grim dark fantasy RPG, hand-crafted pixel style.
Use the Strongman from the attached reference image as the exact canonical model — same silhouette,
armor, colors, proportions and pixel style.
Layout: a single horizontal strip of 3 frames in one row, evenly spaced, each frame exactly
64x96 pixels, the character at identical scale and feet on the same baseline in every frame.
Action: raising the weapon or a bandaged forearm to parry an incoming blow, a braced stance with
feet firmly planted.
Lighting: cold neutral ambient light.
Fully transparent background — output a PNG with an alpha channel.
Do not include: background, ground, text, UI, multiple rows, frame borders or grid lines, bright
colors, cartoon or anime, 3D render.
```

### death — смерть (6 кадров, 384×96 px)

```
Pixel art death animation sprite sheet for a grim dark fantasy RPG, hand-crafted pixel style.
Use the Strongman from the attached reference image as the exact canonical model — same silhouette,
armor, colors, proportions and pixel style.
Layout: a single horizontal strip of 6 frames in one row, evenly spaced, each frame exactly
64x96 pixels, the character at identical scale and feet on the same baseline in every frame.
Action: the heavy fighter collapsing forward across the frames — knees buckle, torso drops, falls
face down — a weighty slow fall in a dark grim tone.
Lighting: cold neutral ambient light.
Fully transparent background — output a PNG with an alpha channel.
Do not include: background, ground, text, UI, multiple rows, frame borders or grid lines, bright
colors, cartoon or anime, 3D render.
```

---

## Цветовые ориентиры

| Элемент        | Цвет            | Hex       |
|----------------|-----------------|-----------|
| Кожа           | тёмный загар    | `#6a4030` |
| Броня (кожа)   | тёмно-коричнев. | `#3a2010` |
| Бинты на руках | грязный бежевый | `#7a6850` |
| Сапоги         | чёрно-коричнев. | `#2a1a0a` |
| Металл оружия  | тёмно-серый     | `#4a4040` |
| Акценты        | потёртая ржавч. | `#6a4030` |
