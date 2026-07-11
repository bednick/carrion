# Промпт: Логово мародёров ★★☆

**Фракция:** Мародёры — Броня | **Тип:** средняя
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Организованный лагерь банды. Мародёры выстроили простейшие укрепления — деревянный частокол, сторожевые вышки.
Методичный порядок среди хаоса. Дымное небо, факелы на постах. Чужаков здесь убивают.

---

## FAR — `far.png` (небо + частокол вдали, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Marauder Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, oppressive bandit-camp mood.
A dark overcast evening sky, silhouettes of a crude wooden palisade wall along the horizon, a rough-hewn watchtower
shape, a few torch flames flickering on the towers, thin smoke plumes rising from inside the camp, grey-brown grim
horizon. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited palette, approximately: #1e1e2a, distant wood #2a1a0a, torch #8a4a1a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Marauder Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, oppressive bandit-camp mood.
A smokier night sky: heavy brown-grey smoke drifting across the upper area, a taller jagged palisade-and-watchtower
silhouette line, more torch glows dotted along the wall, a faint ember haze at the camp's base. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon
ONLY, no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited palette, approximately: #1e1e2a, distant wood #2a1a0a, torch #8a4a1a.
```

---

## MID — `mid.png` (укрепления, альфа, средняя скорость)

> Дальние силуэты частокола, вышек, клеток на горизонте, за героем. Только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Marauder Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-brown palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, dirt or smoke; all empty
space, including below the objects, must be transparent.
Draw ONLY distant silhouettes along an imaginary horizon: a crude sharpened-stake palisade, a rough log watchtower, an
empty iron cage hanging from a post, stripped weapon racks, stacked crates and barrels, hanging chains — faded dark
grey-brown with tiny torch-flame glints, little detail, spread out with wide empty transparent gaps. Nothing touches the
top edge or stands on drawn ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Tones near #3a2a1a,
torch #8a5a1a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Marauder Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-brown palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, dirt or smoke; all empty space
transparent.
Draw ONLY distant silhouettes along the horizon, a DIFFERENT set: a gallows post with a hanging chain, stolen military
banners nailed to a wall section, a leaning tower with a torch, a stack of looted shields, a barricade of carts — faded
dark grey-brown with torch glints, minimal detail, wide empty transparent gaps. Nothing touches the top edge; nothing on
drawn ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Tones near #3a2a1a, torch #8a5a1a.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Утоптанная земля лагеря под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Marauder Lair" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Beaten dirt worn smooth by many boots, seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge.
Evenly, uniformly detailed: discarded broken weapons, charred torch stubs and ash piles, dropped dented belt buckles and
iron coins, boot prints in dried mud, torn rope and chain links, an empty flask — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Beaten-earth palette: #2a1e0f, iron #4a4a4a, ash #3a3a3a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Marauder Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Beaten camp dirt from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but MUDDIER and more littered: churned brown mud with boot prints and
cart ruts, scattered bones, broken bottles, a trampled banner scrap, spilled coins and a snapped spear shaft — evenly
distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Beaten-earth palette: #2a1e0f, iron #4a4a4a, ash #3a3a3a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов частокола/брёвен стоят на нижней кромке и
> растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Marauder
Lair" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, dirt or smoke; all empty
space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized near-black silhouettes standing along the bottom edge: thick sharpened palisade
stakes, a heavy log post with a chain hanging off it, stacked barrels, a planted torch stake with a low flame (vary these so there are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to
camera), with small transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #1a120a, torch #8a4a1a.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Marauder
Lair" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, dirt or smoke; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized near-black silhouettes along the bottom edge, a DIFFERENT set: a leaning watchtower
leg of rough logs, an iron cage on a post, a weapon rack of looted spears, a tipped barrel (vary these to
roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with small transparent gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #1a120a, torch #8a4a1a.
```

---

## Палитра

| Элемент          | Hex       |
|------------------|-----------|
| Тёмное небо      | `#1e1e2a` |
| Дерево вдали     | `#2a1a0a` |
| Факелы           | `#8a4a1a` |
| Дерево           | `#3a2a1a` |
| Ржавое железо    | `#5a4a3a` |
| Утоптанная земля | `#2a1e0f` |
| Железо           | `#4a4a4a` |
| Пепел            | `#3a3a3a` |
