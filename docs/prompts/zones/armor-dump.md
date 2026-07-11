# Промпт: Свалка доспехов ★☆☆

**Фракция:** Мародёры — Броня | **Тип:** стартовая
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Место, куда мародёры сносили снятую броню перед сортировкой. Горы мятого железа, сломанные клинки, ржавчина на всём.
Тусклое дымное небо, запах металла и гнили. Хаотичная, отталкивающая красота свалки.

---

## FAR — `far.png` (небо + дым, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Armor Dump" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim industrial mood.
A wide overcast grey sky with thin smoke plumes rising from distant smouldering fires, oppressive low cloud, a flat grey
horizon with faint silhouettes of junk piles far away, a slight orange tint from distant embers. No clean blue sky.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited palette, approximately: #3a3a3a, #4a4a4a, ember glow #6a3a1a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the "Armor Dump" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim industrial mood.
A heavier smog sky: thick brown-grey smoke haze blanketing the upper area, a few darker plumes, a dull diffuse light
behind the smog, and a higher horizon lined with darker junk-pile silhouettes and a faint ember glow at their base.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY, no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited palette, approximately: #3a3a3a, #4a4a4a, ember glow #6a3a1a.
```

---

## MID — `mid.png` (дальние силуэты, альфа, средняя скорость)

> Силуэты дальних куч хлама на горизонте, за героем. Никакого сплошного пола — только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Armor Dump" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-rust palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, smoke or haze; all empty
space, including below the objects, must be transparent.
Draw ONLY distant silhouettes along an imaginary horizon: big heaps of discarded plate armor and chainmail, dented
helmets stacked, broken swords and spear tips jutting from the piles, a crude collapsed sorting table — faded dark
grey-rust, little detail, spread out with wide empty transparent gaps. Nothing touches the top edge or stands on drawn
ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #5a5a5a, #6a3a1a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Armor Dump" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-rust palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, smoke or haze; all empty space
transparent.
Draw ONLY distant silhouettes along the horizon, a DIFFERENT arrangement: a burning rubbish barrel with a thin smoke
wisp, taller leaning towers of scrap metal, a half-buried shield mound, crushed wooden crates, a bent weapon rack —
faded dark grey-rust, minimal detail, wide empty transparent gaps. Nothing touches the top edge; nothing on drawn
ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #5a5a5a, #6a3a1a.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Земля в ржавчине и обломках металла под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Armor Dump" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Rust-stained dirt seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly
detailed: rust flakes, broken chain links, loose rivets, bent iron plate scraps, smashed buckles, iron ring fragments
and metal shavings half-buried in grey-brown dirt — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Rust and iron palette: #7a3a1a, #4a4a4a, dirt #3a2a1a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Armor Dump" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Scrap-littered dirt from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), but ASHIER and more metallic: a packed surface of trodden grey ash
and rust dust with scattered crushed mail rings, snapped blade fragments, dented visor pieces and stray bolts — evenly
distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Rust and iron palette: #7a3a1a, #4a4a4a, dirt #3a2a1a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов металлолома стоят на нижней кромке и
> растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Armor
Dump" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, smoke or haze; all empty
space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized dark silhouettes standing along the bottom edge: a toppled stack of dented plate
armor, a broken sword jammed upright, a crushed helmet pile, a leaning scrap-metal heap (vary these so there
are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to camera), with small
transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark rust-iron tones #3a2a1a, #4a4a4a.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Armor
Dump" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, smoke or haze; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized dark silhouettes along the bottom edge, a DIFFERENT set: a rusted shield leaned on
edge, a bundle of broken spear shafts, a tipped-over iron barrel spilling scrap, a short stub of chain coiled on the
ground (vary these to roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal detail, with small transparent
gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Dark rust-iron tones #3a2a1a, #4a4a4a.
```

---

## Палитра

| Элемент       | Hex       |
|---------------|-----------|
| Дымное небо   | `#3a3a3a` |
| Дым / зола    | `#4a4a4a` |
| Далёкий огонь | `#6a3a1a` |
| Ржавый металл | `#7a3a1a` |
| Серое железо  | `#5a5a5a` |
| Земля         | `#3a2a1a` |
