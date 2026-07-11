# Промпт: Растоптанные луга ★☆☆

**Фракция:** Конница — Дикие звери | **Тип:** стартовая
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Поле, где конница делала разгон. Земля взрыта копытами, повсюду сломанные копья и упряжь. Запах разложения привлёк
крыс. В отличие от магических зон — **не ночь**, серое дневное освещение без солнца, хмурые сумерки, холодный ветер.

---

## FAR — `far.png` (небо + горизонт, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Trampled Meadows"
zone. Hand-crafted dark fantasy pixel art, cold desaturated palette, grim overcast DAYLIGHT (not night, no moon, no
stars). Heavy flat grey sky without sun, low grey clouds with a faint silver rim, a very low flat cold horizon with a
distant treeline smudge and grey mist. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip, about 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band) — not a square; tiles seamlessly left to right. Keep the overcast evenly varied with no single bright cloud-break
or focal highlight that would visibly duplicate when the strip repeats.
Limited cold palette, approximately: #4a4a5a, #6a6a7a, #5a5a5a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Trampled Meadows" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim overcast DAYLIGHT (no sun, no moon).
A heavier, rainier sky: dense low grey-green storm clouds, faint drizzle haze, a slightly higher horizon with rolling
dead-grass hills and a thin distant treeline silhouette. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY, no foreground, no people, no
text. Opaque image. Very wide horizontal strip, about 8:1 (much wider than one screen — about twice as wide as the other
layers), not a square; tiles seamlessly left to right. Keep the sky evenly varied with no single bright break or focal
highlight that would visibly duplicate when the strip repeats.
Limited cold palette, approximately: #4a4a5a, #6a6a7a, #5a5a4a.
```

---

## MID — `mid.png` (дальние силуэты, альфа, средняя скорость)

> Мелкие далёкие объекты на горизонте, за героем. Никакого сплошного поля — только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Trampled Meadows" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-brown palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, mud or mist; all empty
space, including below the objects, must be transparent.
Draw ONLY small far-away silhouettes along an imaginary horizon line: snapped lance shafts leaning at angles, a broken
supply-wagon frame, a collapsed makeshift fence, a tattered cavalry banner on a pole — faded dark grey-brown, little
detail, spread out with wide empty transparent gaps. Nothing touches the top edge or stands on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #4a3a2a, #5a5a4a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Trampled Meadows" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-brown palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, mud or mist; all empty space
transparent.
Draw ONLY small far-away silhouettes along the horizon, a DIFFERENT set: a toppled hay cart, a cluster of broken
hitching posts, a half-buried siege ladder, a lone dead tree, a leaning fence section — faded dark grey-brown, minimal
detail, wide empty transparent gaps between them. Nothing touches the top edge; nothing on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #4a3a2a, #5a5a4a.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Взрытая копытами земля под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там). Равномерная фактура, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Trampled Meadows" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Heavily churned muddy earth seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly,
uniformly detailed: deep hoof-print furrows filled with rainwater, torn dead grass pressed flat into mud, small wooden
splinters, scattered leather strap pieces and buckle fragments, small displaced rocks — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Grey-brown mud palette: #3a2a1a, #4a3a2a, dead grass #5a5a3a, puddle #2a3a4a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Trampled Meadows" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Churned earth from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but GRASSIER and less waterlogged: trampled matted dead-grass turf torn
open into mud patches, a few shallow hoof prints, scattered straw, small snapped twigs and a stray horseshoe shape — all
evenly distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Grey-brown-green palette: #3a2a1a, #4a3a2a, dead grass #5a5a3a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов стоят на нижней кромке и растут вверх,
> ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Trampled
Meadows" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, mud or mist; all empty
space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized dark silhouettes standing along the bottom edge: a broken jousting lance stuck in
the ground, tall clumps of trampled dead grass, a tilted wagon wheel, a leaning fence post (vary these so
there are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to camera), with small
transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark tones #2a1a0a, #3a2a1a.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Trampled
Meadows" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, mud or mist; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized dark silhouettes along the bottom edge, a DIFFERENT set: a snapped cart axle with
broken wheel, drooping tall weeds, a discarded saddle hump, a leaning bundle of spears (vary these to roughly
7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with small transparent gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark tones #2a1a0a, #3a2a1a.
```

---

## Палитра

| Элемент          | Hex       |
|------------------|-----------|
| Серое небо       | `#4a4a5a` |
| Облака           | `#6a6a7a` |
| Хмурый горизонт  | `#5a5a5a` |
| Взрытая грязь    | `#4a3a2a` |
| Мокрая земля     | `#3a2a1a` |
| Дерево           | `#6a5a3a` |
| Мёртвая трава    | `#5a5a3a` |
| Вода в следах    | `#2a3a4a` |
