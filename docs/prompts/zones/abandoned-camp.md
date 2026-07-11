# Промпт: Брошенный лагерь ★★☆

**Фракция:** Мародёры — Броня | **Тип:** средняя
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Военный лагерь одной из фракций — командный шатёр, обозные телеги, укрепления. Командиры сбежали. Ветераны-мародёры
обосновались здесь. Всё брошено в спешке — качество построек выше, чем в логове, но тоже запустение.

---

## FAR — `far.png` (небо + лагерь вдали, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Abandoned Camp" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, desolate abandoned mood.
A grey overcast dusk sky, distant silhouettes of large canvas command tents on the horizon, a tall wooden banner pole
with a torn flag barely visible, faint supply-wagon outlines far away, a still and empty camp skyline — no activity.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #2a2a3a, silhouette #1a1a2a, canvas #3a3a4a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Abandoned Camp" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, desolate abandoned mood.
A duskier sky with thin cold mist over the camp: a row of sagging command-tent silhouettes on the horizon, a leaning
banner pole, a couple of distant cart outlines, faint cold light low on the horizon — empty and still. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant
horizon ONLY, no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited cold palette, approximately: #2a2a3a, silhouette #1a1a2a, canvas #3a3a4a.
```

---

## MID — `mid.png` (лагерь, альфа, средняя скорость)

> Дальние силуэты шатров, телег, стоек на горизонте, за героем. Только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Abandoned Camp" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-brown palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, dirt or fog; all empty
space, including below the objects, must be transparent.
Draw ONLY distant silhouettes along an imaginary horizon: a large command tent with a torn open flap, heavy supply
wagons with broken wheels, empty weapon racks stripped clean, a collapsed cooking tripod, leaning fortification stakes —
faded dark grey-brown, little detail, spread out with wide empty transparent gaps. Nothing touches the top edge or
stands on drawn ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Tones near #4a4a3a, #3a2a1a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Abandoned Camp" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-brown palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, dirt or fog; all empty space
transparent.
Draw ONLY distant silhouettes along the horizon, a DIFFERENT set: a half-collapsed tent with a slumped frame, a tipped
supply cart spilling crates, a fortification line of angled stakes, stacked looted crates, a lone broken banner pole —
faded dark grey-brown, minimal detail, wide empty transparent gaps. Nothing touches the top edge; nothing on drawn
ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Tones near #4a4a3a, #3a2a1a.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Земля лагеря с колеёй и соломой под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Abandoned Camp" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Muddy camp ground seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly
detailed: wagon-wheel ruts pressed into mud, scattered straw and hay, dropped supply items (empty sack, broken clay jug,
iron pot on its side), boot and cart tracks, torn canvas scraps, spilled grain — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Mud-and-straw palette: #3a2a1a, straw #6a5a2a, mud #2a1a0a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Abandoned Camp" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Camp ground from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but DRIER and dustier: trodden earth with patches of scattered straw, faint
tent-peg holes and rope ends, a dropped tin cup, broken plank fragments, a torn military insignia badge and bootprints —
evenly distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Mud-and-straw palette: #3a2a1a, straw #6a5a2a, mud #2a1a0a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов шатра/телеги стоят на нижней кромке и
> растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Abandoned
Camp" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, dirt or fog; all empty
space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized dark silhouettes standing along the bottom edge: the corner of a sagging command
tent with a torn flap, a broken supply-wagon wheel, a leaning banner pole, a stack of crates (vary these so
there are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to camera), with small
transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark tones #1a1a2a, wood #3a2a1a.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Abandoned
Camp" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, dirt or fog; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized dark silhouettes along the bottom edge, a DIFFERENT set: an empty weapon rack, a
tipped cooking tripod with a cold pot, angled fortification stakes with cut rope, a barrel on its side (vary these to roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with small transparent gaps between
them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark tones #1a1a2a, wood #3a2a1a.
```

---

## Палитра

| Элемент           | Hex       |
|-------------------|-----------|
| Пасмурный закат   | `#2a2a3a` |
| Силуэты           | `#1a1a2a` |
| Ткань вдали       | `#3a3a4a` |
| Палатка           | `#4a4a3a` |
| Дерево            | `#3a2a1a` |
| Ткань             | `#5a5a4a` |
| Солома            | `#6a5a2a` |
| Грязь             | `#2a1a0a` |
