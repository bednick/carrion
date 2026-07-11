# Промпт: Склеп ★★☆

**Фракция:** Магия — Нежить | **Тип:** средняя
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Подземные камеры, приготовленные магами для погребения союзников. Ритуал прервали. Темно, тесно, душно. Каменные своды
давят сверху. Тусклые факелы на стенах почти догорели. В отличие от всех остальных зон — **интерьер**, не улица. Неба
нет: дальний слой — это уходящая в темноту глубина свода.

---

## FAR — `far.png` (своды + глубина, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far BACKGROUND layer for a dark-fantasy side-scrolling battle game — the interior of the "Crypt"
zone. NO sky, NO outdoor elements — this is underground. Hand-crafted dark fantasy pixel art, cold damp palette,
claustrophobic mood.
A deep underground stone arched ceiling and a corridor vanishing into darkness, rows of stone burial niches barely
visible in the distance, a single dying torch sconce on a far wall casting a faint orange glow into heavy shadow.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Background depth ONLY — no foreground objects, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited palette, approximately: #0a0a0f, #2a2a3a, torch #6a3a1a.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far BACKGROUND layer for a dark-fantasy battle game — the interior of the "Crypt" zone. NO sky, NO
outdoor elements — underground. Hand-crafted dark fantasy pixel art, cold damp palette, claustrophobic mood.
A different deep interior: a wider vaulted stone hall fading into pitch darkness, distant pillars receding in shadow, two
faint dying torch glows far apart on the walls, dripping damp stone. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Background depth ONLY — no foreground objects, no
people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited palette, approximately: #0a0a0f, #2a2a3a, torch #6a3a1a.
```

---

## MID — `mid.png` (силуэты склепов, альфа, средняя скорость)

> Силуэты саркофагов/ниш по сторонам, между героем и стенами. Только силуэты, остальное прозрачно (стены/пол рисует
> far/near).

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the interior of the "Crypt" zone.
Hand-crafted dark fantasy pixel art, cold damp grey palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any wall fill, ceiling, floor or fog; all
empty space, including below the objects, must be transparent.
Draw ONLY dim silhouettes set back from the camera: stone sarcophagi along the sides, iron-barred burial alcoves with
sealed lids, crumbling pillars carved with skulls, half-melted candle stubs in iron holders — dark grey with faint warm
torch-lit edges, little detail, spread out with wide empty transparent gaps. Nothing touches the top edge.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #3a3a3a, candle #8a6a2a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the interior of the "Crypt" zone.
Hand-crafted dark fantasy pixel art, cold damp grey palette.
Fully transparent background — output a PNG with an alpha channel. No wall fill, ceiling, floor or fog; all empty space
transparent.
Draw ONLY dim silhouettes set back from the camera, a DIFFERENT set: a toppled stone urn and its shards, a stacked
ossuary niche of bones, a leaning grave statue, a broken iron candelabra, a cracked tomb lid ajar — dark grey with faint
torch-lit edges, minimal detail, wide empty transparent gaps. Nothing touches the top edge.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #3a3a3a, candle #8a6a2a.
```

---

## NEAR — `near.png` (пол, непрозрачный, скорость героя)

> Каменный пол склепа под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл — критично.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the floor of the interior "Crypt" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold damp palette.
Worn stone burial floor seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly
detailed: stone tiles with barely legible inscriptions, scattered small bone fragments, dried wax drips, damp moss
patches between tiles, dark water pooled in cracks, dust and decayed cloth threads — distributed evenly.
No large unique landmark objects, no sky, no walls. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Dark stone palette: #1e1e2a, moss #2a3a2a, bone #5a5a4a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the floor of the interior "Crypt" zone.
Hand-crafted dark fantasy pixel art, cold damp palette.
Worn stone floor from a high oblique angle — a steep near-top-down view
(camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge),
but WETTER and more broken: cracked flagstones with dark water seeping
between them, slick moss patches, fallen grave-marker fragments, scattered bone shards and dried wax pools — evenly
distributed, no large landmark objects. No sky, no walls. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Dark stone palette: #1e1e2a, moss #2a3a2a, bone #5a5a4a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов колонн/саркофагов стоят на нижней кромке и
> растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the interior
"Crypt" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any wall, ceiling, floor or fog; all
empty space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized near-black silhouettes standing along the bottom edge: a thick stone pillar carved
with skulls, the end of a stone sarcophagus, a tall iron floor candelabra, a chain coiled at a pillar's base (vary these so there are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to camera),
faint warm torch edge, with small transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0a0a0f, torch #6a3a1a.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the interior
"Crypt" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No wall, ceiling, floor or fog; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized near-black silhouettes along the bottom edge, a DIFFERENT set: a broken stone
archway pillar base, a leaning tomb statue, a tipped sarcophagus lid, a floor-standing iron torch stand with a low flame
(vary these to roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal detail, faint warm torch edge, with
small transparent gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0a0a0f, torch #6a3a1a.
```

---

## Палитра

| Элемент            | Hex       |
|--------------------|-----------|
| Непроглядная тьма  | `#0a0a0f` |
| Холодный камень    | `#2a2a3a` |
| Угасающий факел    | `#6a3a1a` |
| Мокрый камень/мох  | `#2a3a2a` |
| Железо             | `#3a3a3a` |
| Воск свечей        | `#8a6a2a` |
| Кость              | `#5a5a4a` |
