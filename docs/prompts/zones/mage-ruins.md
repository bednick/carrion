# Промпт: Руины магов ★★☆

**Фракция:** Магия — Нежить | **Тип:** средняя
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Развалины походного лагеря мага-командира. Обугленные шатры, рухнувшие каменные башенки. Где-то в камнях ещё тлеет
магия — синие и фиолетовые отсветы. Опаснее Мёртвых полей. Тот же холодный ночной свет, но больше структур — остатки
цивилизации.

---

## FAR — `far.png` (небо + силуэты башен, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Mage Ruins" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim arcane mood.
A dark night sky with purple and blue magical storm clouds, faint arcane lightning flicker far away, distant crumbled
wizard-tower silhouettes on the horizon with a subtle purple glow behind broken stone spires. Starless cold blue-purple
sky, distant objects only as shapes. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #0f0a1e, #1a1a3e, glow #4a3a6a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Mage Ruins" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim arcane mood.
A calmer but eerier night sky: deep blue-purple gradient with a pale veiled moon and slow drifting violet clouds, a
single distant broken spire silhouette leaning on the horizon with a faint blue arcane aura around its top. No
lightning. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY, no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #0f0a1e, #1a1a3e, glow #4a3a6a.
```

---

## MID — `mid.png` (дальние силуэты руин, альфа, средняя скорость)

> Дальние силуэты разрушенных башен/шатров на горизонте, за героем. Только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Mage Ruins" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-purple palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, floor or fog; all empty
space, including below the objects, must be transparent.
Draw ONLY distant silhouettes along an imaginary horizon: collapsed stone wizard towers, burned tent frames, a leaning
arcane pedestal, broken stone spires — faded dark grey-purple with tiny faint blue rune glints, little detail, spread
out with wide empty transparent gaps. Nothing touches the top edge or stands on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #3a3a4a, glow #3a3aaa.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Mage Ruins" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-purple palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, floor or fog; all empty space
transparent.
Draw ONLY distant silhouettes along the horizon, a DIFFERENT set: a half-standing rune archway, toppled stone columns
in a row, a cracked floating-crystal monument, a charred tattered banner pole — faded dark grey-purple with faint blue
glints, minimal detail, wide empty transparent gaps. Nothing touches the top edge; nothing on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #3a3a4a, glow #3a3aaa.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Разбитый каменный пол с руническими сколами под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Mage Ruins" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Broken stone floor tiles seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge.
Evenly, uniformly detailed: cracked flagstones with worn arcane symbols, charred wooden debris and ash, small shattered blue crystal
shards glowing faintly, burned scroll fragments, spilled dark ink stains — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Cold stone palette: #2a2a3a, ash #3a2a1a, faint blue crystal #5a5aff.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Mage Ruins" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Broken stone floor from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but more RUBBLE-strewn: cracked tiles half-buried under crumbled
masonry and grey dust, thin glowing blue rune-cracks running through the stone, a few scattered crystal slivers and bits
of charred parchment — evenly distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Cold stone palette: #2a2a3a, ash #3a2a1a, faint blue crystal #5a5aff.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов обломков башен/колонн стоят на нижней
> кромке и растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Mage
Ruins" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, floor or fog; all empty
space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized near-black silhouettes standing along the bottom edge: a shattered stone column, a
broken arcane pedestal with a cracked crystal, a charred tent frame, a fallen rune-stone slab — faint blue glow edges
only (vary these so there are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with
small transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0f0a1e, glow #3a3aaa.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Mage
Ruins" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, floor or fog; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized near-black silhouettes along the bottom edge, a DIFFERENT set: a leaning rune
archway fragment, a toppled bookshelf spilling charred scrolls, a cracked obelisk, a broken staff stuck upright — faint
blue glow edges only (vary these to roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal detail, with
small transparent gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0f0a1e, glow #3a3aaa.
```

---

## Палитра

| Элемент             | Hex       |
|---------------------|-----------|
| Чернильный фиолет.  | `#0f0a1e` |
| Синий ночной        | `#1a1a3e` |
| Далёкий блик        | `#4a3a6a` |
| Холодный камень     | `#3a3a4a` |
| Обгоревшее          | `#2a1a0a` |
| Магическое свечение | `#3a3aaa` |
| Синий кристалл      | `#5a5aff` |
