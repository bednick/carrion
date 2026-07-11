# Промпт: Логово зверей ★★☆

**Фракция:** Конница — Дикие звери | **Тип:** средняя
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Хищники обосновались среди костей лошадей и людей. Появились звериные норы и логова. Тёмная чаща у леса. Запах
территории, не еды. Опаснее лугов — здесь зверь чувствует себя хозяином.

---

## FAR — `far.png` (лес + небо, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, threatening wilderness mood.
A dark overcast dusk sky above a dense dark-forest treeline: silhouettes of massive gnarled old trees on the horizon (no
individual leaves), a few faint dim-yellow eye glints hinted between distant trunks, cold dark green-black atmosphere.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant treeline ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #0a1a0a, #1a1a2a, #2a2a1a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, threatening wilderness mood.
A deeper-night sky with a faint sickly moon glow behind the canopy, a taller jagged treeline of dead gnarled trees on
the horizon, thin cold mist drifting low between the distant trunks, more eye glints scattered in the dark. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and
distant treeline ONLY, no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #0a1a0a, #1a1a2a, #2a2a1a.
```

---

## MID — `mid.png` (силуэты логова, альфа, средняя скорость)

> Дальние силуэты нор, костяных куч и стволов на горизонте, за героем. Только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated green-black palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, soil or fog; all empty
space, including below the objects, must be transparent.
Draw ONLY distant silhouettes along an imaginary horizon: earthen den mounds with dark entrance holes, piles of bleached
horse skulls and ribcages, gnarled tree trunks with deep claw gouges, gnawed lance shafts — faded dark green-black,
little detail, spread out with wide empty transparent gaps. Nothing touches the top edge or stands on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #1a2a1a, bone #7a7a6a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated green-black palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, soil or fog; all empty space
transparent.
Draw ONLY distant silhouettes along the horizon, a DIFFERENT set: a large hollowed log den, a leaning rack of bones, a
toppled cavalry cart half-consumed, dead saplings with shredded bark, a mound of antlers and ribs — faded dark
green-black, minimal detail, wide empty transparent gaps. Nothing touches the top edge; nothing on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable.
Silhouette tones near #1a2a1a, bone #7a7a6a.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Тёмная лесная подстилка под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Beast Lair" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Dark forest floor seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly
detailed: dead leaves and dark soil, large claw marks raked into earth, scattered small animal bones, shed fur tufts,
big paw prints in damp soil, dark roots breaking the surface, patches of dried dark blood — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Extremely dark palette: #1a1a0a, roots #2a1a0a, tracks #0a0f0a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Beast Lair" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Dark forest floor from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but more BARE and trodden: packed dark earth worn smooth around a den
with scattered gnawed bone fragments, sparse dead leaves, deep paw prints, exposed twisted roots and a few feathers —
evenly distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Extremely dark palette: #1a1a0a, roots #2a1a0a, tracks #0a0f0a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов стволов/корней стоят на нижней кромке и
> растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Beast
Lair" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, soil or fog; all empty
space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized near-black silhouettes standing along the bottom edge: thick gnarled tree trunks
with clawed bark, a thick tangle of exposed roots rising from the soil, a big bleached ribcage propped up, tall dark
brush (vary these so there are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very
close to camera), with small transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0a0f0a, bark #2a1a0a.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Beast
Lair" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, soil or fog; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized near-black silhouettes along the bottom edge, a DIFFERENT set: a hollow stump den
mouth, a fallen mossy log, a low bush of drooping dead branches, a large skull jammed on a broken stake (vary these to roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with small transparent gaps between
them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0a0f0a, bark #2a1a0a.
```

---

## Палитра

| Элемент          | Hex       |
|------------------|-----------|
| Тёмный лес       | `#0a1a0a` |
| Ночное небо      | `#1a1a2a` |
| Лес вдали        | `#2a2a1a` |
| Тёмная земля     | `#1a2a1a` |
| Кости            | `#7a7a6a` |
| Кора / корни     | `#2a1a0a` |
| Лесная подстилка | `#1a1a0a` |
| Следы            | `#0a0f0a` |
