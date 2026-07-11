# Промпт: Мёртвые поля (Dead Fields) ★☆☆

**Фракция:** Магия — Нежить | **Тип:** стартовая
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Равнина, где стояли войска магической фракции. Земля выжжена, трава поседела. Остатки ритуалов удержали мёртвых на
ногах, над землёй клубится лёгкий фиолетовый туман. Бледная мёртвая луна за фиолетовыми тучами — единственный источник
холодного света. Палитра холодная, десатурированная, мрачная.

---

## FAR — `far.png` (небо, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim post-battle mood.
A wide panoramic night sky: heavy overcast, a single pale dying crescent moon breaking through purple-grey storm clouds (exactly ONE moon, drawn a single
time across the whole strip and kept away from the left and right edges), a very
low flat distant scorched horizon along the bottom with faint purple magical fog and a few tiny far-away glows.
Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no large objects, no people, no text. Opaque image.
Very wide horizontal strip, about 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band) — not a square; tiles seamlessly left to right, wide enough that only ONE copy of the moon is ever on screen at
once. Limited cold palette, approximately: #1a0a2e, #2a2a3e, #c8c8d8.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette, grim mood.
A wide panoramic night sky with the moon HIDDEN behind thick clouds — only a single diffuse pale moon-glow through the overcast (one glow only, drawn once across the whole strip),
layered purple-grey cloud bands, distant lightning-free haze, and a slightly higher rolling scorched horizon with denser
purple fog and two or three faint glows. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY, no foreground, no people, no text. Opaque.
Very wide horizontal strip, about 8:1 (much wider than one screen — about twice as wide as the other layers), not a
square; tiles seamlessly left to right, wide enough that the single moon-glow is never seen twice at once.
Limited cold palette, approximately: #1a0a2e, #2a2a3e, #c8c8d8.
```

---

## MID — `mid.png` (дальние силуэты, альфа, средняя скорость)

> Не передний план. Мелкие далёкие объекты на линии горизонта, за спиной героя. Своей сплошной земли нет — только
> силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-purple palette.
The background must be fully transparent — output a PNG with an alpha channel. Do NOT draw any sky, ground, floor, fog
or haze; all empty space, including below the objects, must be transparent.
Draw ONLY small far-away silhouettes lined up along an imaginary horizon in the lower-middle: bare leafless dead trees,
broken siege-engine frames, leaning tattered banners, fallen stone pillars — faded dark grey-purple, little detail,
spread out with wide empty transparent gaps. They must not touch the top edge or stand on any drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable left to right. Silhouette tones near #2a2a3e, #1a0a2e.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated grey-purple palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, fog or haze fill; all
empty space must be transparent.
Draw ONLY small far-away silhouettes along the lower-middle horizon, a DIFFERENT set than usual: a leaning ruined
gallows, a row of crooked grave crosses, a collapsed wagon, two thin dead saplings, a distant broken archway — faded
dark grey-purple, minimal detail, with wide empty transparent gaps. Nothing touches the top edge; nothing stands on
drawn ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Silhouette tones near #2a2a3e, #1a0a2e.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Поверхность под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там). Равномерная фактура без уникальных
> «лендмарков». Бесшовный тайл — критично (едет быстрее всех).

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Dead Fields" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated palette.
Ashen cracked scorched earth stretching horizontally, seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge. Evenly, uniformly detailed: fine cracks, patches of grey ash, scattered SMALL bone shards, tufts of grey
dead grass, faint burn marks, subtle purple magical residue — distributed evenly across the whole strip.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (~8:1), seamlessly tileable left to right
with no visible seam or obvious repeating motif (this layer scrolls fastest). Cold grey ash palette: #2a2a2a, #4a4a4a,
faint purple residue #6a3a8a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the "Dead Fields" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette.
Scorched earth from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge, but DRIER and dustier than usual:
cracked grey-brown soil with wider cracks, drifts of pale ash, sparse withered grass clumps, a few small scattered bone
fragments, and faint purple residue pooling in the cracks — all evenly distributed, no large landmark objects.
No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Cold grey-ash palette: #2a2a2a, #4a4a4a, faint purple #6a3a8a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Близко перед камерой, проносится быстрее всех; прячется в бою. Рендерится только в нижней ~½ экрана (полоса ~8:1):
> **~7–8 средних силуэтов** стоят на нижней кромке и растут вверх, ничего **не свисает сверху** — кадрируют, а не
> закрывают.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Dead
Fields" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, fog or haze fill; all
empty space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized near-black silhouettes standing along the bottom edge: big bare dead tree trunks
with branches, chunks of broken siege wreckage, tall clumps of dead grass (vary these so there are roughly
7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to camera), with small transparent gaps
between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0a0a0f, #1a0a2e.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the "Dead
Fields" zone. Hand-crafted dark fantasy pixel art, very dark cold palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, fog or haze; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized near-black silhouettes along the bottom edge, a DIFFERENT set: a leaning broken
stone obelisk, a toppled cart wheel, drooping dead reeds, a snapped banner pole (vary these to roughly 7–8
distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with small transparent gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #0a0a0f, #1a0a2e.
```

---

## Палитра

| Элемент             | Hex       |
|---------------------|-----------|
| Небо тёмно-фиолет.  | `#1a0a2e` |
| Холодный серо-синий | `#2a2a3e` |
| Бледная луна        | `#c8c8d8` |
| Пепельно-серый      | `#6a6a7a` |
| Мёртвая трава       | `#4a4a3a` |
| Магический туман    | `#6a3a8a` |
| Тёмная земля        | `#2a2a2a` |
| Зола                | `#4a4a4a` |
