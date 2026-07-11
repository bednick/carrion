# Промпт: Пастбище хищников ★★☆

**Фракция:** Конница — Дикие звери | **Тип:** средняя
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Боевые кони фракции одичали и собрались в агрессивные табуны. Они вожаки. Открытая местность — степь или широкое поле.
Серое пасмурное небо, холодный ветер. Брошенное военное снаряжение высокого класса. Опасная открытость.

---

## FAR — `far.png` (степь + небо, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Predator Pasture"
zone. Hand-crafted dark fantasy pixel art, cold desaturated palette, grim overcast DAYLIGHT (no sun, no moon).
A vast flat overcast grey sky over open wild plains, low heavy clouds, distant rolling hills barely visible on the
horizon, cold grey-green dead-grass land, strong horizontal emphasis, no trees. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no
foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #4a4a5a, #5a5a4a, dead steppe #4a5a3a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Predator Pasture" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim overcast DAYLIGHT (no sun, no moon).
A windier sky: streaked grey storm clouds dragged sideways, a paler band of light low on the horizon, a flatter
featureless plain with a faint distant ridge and wind-bent dead grass. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY, no foreground, no
people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #4a4a5a, #5a5a4a, dead steppe #4a5a3a.
```

---

## MID — `mid.png` (дальние силуэты, альфа, средняя скорость)

> Дальние силуэты остатков кавалерийского лагеря на горизонте, за героем. Только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Predator Pasture" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-green palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, grass field or mist; all
empty space, including below the objects, must be transparent.
Draw ONLY distant silhouettes along an imaginary horizon: overturned feed troughs, broken hitching posts, a torn cavalry
banner on a leaning pole, a broken jousting lance upright, a half-buried saddle — faded dark grey-green, little detail,
spread out with wide empty transparent gaps. Nothing touches the top edge or stands on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #4a3a2a, #5a5a5a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Predator Pasture" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-green palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, grass field or mist; all empty space
transparent.
Draw ONLY distant silhouettes along the horizon, a DIFFERENT set: a collapsed paddock fence, a toppled supply wagon, a
stack of broken lances, a leaning tent frame, a scatter of large bones — faded dark grey-green, minimal detail, wide
empty transparent gaps. Nothing touches the top edge; nothing on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #4a3a2a, #5a5a5a.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Дикая трава и взрытая копытами земля под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Predator Pasture" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Wild overgrown ground seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly
detailed: tough dead grass and weeds, large hoofprint impressions, torn strips of leather barding, iron buckle pieces,
matted grass pressed flat, coarse fur snagged on thorns, small bones and teeth in dirt — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Cold grey-green palette: #4a5a2a, dirt #3a2a1a, fur #5a4a3a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Predator Pasture" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Wild ground from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but more TRAMPLED to bare earth: wide swaths of flattened dead grass torn
open to dried mud, deep overlapping hoof prints, scattered iron stirrups and strap fragments, tufts of coarse fur and a
few small bones — evenly distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Cold grey-green palette: #4a5a2a, dirt #3a2a1a, fur #5a4a3a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов травы/снаряжения стоят на нижней кромке и
> растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Predator
Pasture" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, grass field or mist; all
empty space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized dark silhouettes standing along the bottom edge: tall clumps of wild dead grass and
thistles, a broken hitching post, a tipped feed trough, a leaning lance (vary these so there are roughly 7–8
distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to camera), with small transparent gaps between
them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark tones #2a2a1a, #3a2a1a.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Predator
Pasture" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, grass field or mist; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized dark silhouettes along the bottom edge, a DIFFERENT set: tall wind-bent weeds, a
discarded saddle on its side, a snapped fence rail, a half-buried shield (vary these to roughly 7–8 distinct
objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with small transparent gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark tones #2a2a1a, #3a2a1a.
```

---

## Палитра

| Элемент       | Hex       |
|---------------|-----------|
| Серое небо    | `#4a4a5a` |
| Горизонт      | `#5a5a4a` |
| Мёртвая степь | `#4a5a3a` |
| Дикая трава   | `#5a6a3a` |
| Грязь/земля   | `#3a2a1a` |
| Металл        | `#5a5a5a` |
| Шерсть        | `#5a4a3a` |
