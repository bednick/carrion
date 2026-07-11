# Промпт: Поле Битвы ★★★

**Фракция:** Все три | **Тип:** финальная
**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой; для `mid`/`fore` прозрачность
просим явно («output a PNG with an alpha channel»). Общие правила, 4-слойная модель и конвенция вариантов (по 2 промта
на слой → `<layer>.1.png` / `<layer>.2.png`) — [`_style-guide.md`](../_style-guide.md).

## Атмосфера (лор)

Эпицентр столкновения трёх армий. Магия, кровь и железо смешались во что-то новое. Самое тёмное и хаотичное место на
карте. Три фракции видны одновременно: синяя магия, зелёная трава/кости, ржавое железо мародёров. Нечто выросло из самой
битвы — финальный босс — но его здесь нет, только следы.

---

## FAR — `far.png` (небо эпоса, непрозрачный, медленный)

**Вариант 1 (`far.1.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy side-scrolling battle game — the final "Battlefield"
zone. Hand-crafted dark fantasy pixel art, cold chaotic desaturated palette, apocalyptic mood — the most dramatic sky in
the game. A massive dark storm sky combining three themes: deep purple arcane magic clouds, dark green decomposition
miasma, and heavy grey-brown fire smoke, with arcane lightning arcing in the clouds and a faint red-purple aura on the
horizon. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant horizon ONLY — no foreground, no people, no text. Opaque image.
Very wide horizontal strip,8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), a long thin band — not a square; tiles seamlessly left to right.
Limited palette, approximately: #2a0a3e, #0a2a0a, smoke #3a2a1a, lightning #6a6aaa.
```

**Вариант 2 (`far.2.png`):**
```
Generate a pixel-art far SKY background layer for a dark-fantasy battle game — the final "Battlefield" zone.
Hand-crafted dark fantasy pixel art, cold chaotic desaturated palette, apocalyptic mood.
A different storm: the three themes split into bands — purple arcane clouds high up, green miasma rolling low, brown
smoke columns rising on one side — a sickly glow on the horizon and a single fork of arcane lightning. Keep every distinct distant shape different — no repeated or duplicated silhouettes. Sky and distant
horizon ONLY, no foreground, no people, no text. Opaque image.
Very wide horizontal strip, 8:1 (much wider than one screen — about twice as wide as the other layers, a long thin
band), not a square; tiles seamlessly left to right.
Limited palette, approximately: #2a0a3e, #0a2a0a, smoke #3a2a1a, lightning #6a6aaa.
```

---

## MID — `mid.png` (дальние силуэты трёх фракций, альфа, средняя скорость)

> Дальние силуэты обломков всех трёх фракций на горизонте, за героем. Только силуэты, остальное прозрачно.

**Вариант 1 (`mid.1.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the final "Battlefield" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette mixing blue-grey, rust-brown and dead-green.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, crater fill or fog; all
empty space, including below the objects, must be transparent.
Draw ONLY distant silhouettes along an imaginary horizon, mixing all three factions: broken wizard staves and a cracked
rune monument (faint blue glow), bleached horse skulls and bone piles, a huge rusted armor heap with shattered lances —
faded dark, little detail, spread out with wide empty transparent gaps. Nothing touches the top edge or stands on drawn
ground. Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Tones near #1a1a3a, #3a4a2a, #4a2a1a.
```

**Вариант 2 (`mid.2.png`):**
```
Generate a pixel-art DISTANT MIDGROUND parallax layer for a dark-fantasy battle game — the final "Battlefield" zone.
Hand-crafted dark fantasy pixel art, cold desaturated palette mixing blue-grey, rust-brown and dead-green.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, crater fill or fog; all empty space
transparent.
Draw ONLY distant silhouettes along the horizon, a DIFFERENT three-faction mix: a leaning glowing rune archway, a
ribcage-and-antler pile, a toppled siege engine, a wall of fused rusted armor and shields, a broken banner — faded dark,
minimal detail, wide empty transparent gaps. Nothing touches the top edge; nothing on drawn ground.
Show about 7–8 separate distinct silhouettes across the strip — every object different, with no repeated or duplicated shapes. Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly tileable. Tones near #1a1a3a, #3a4a2a, #4a2a1a.
```

---

## NEAR — `near.png` (земля, непрозрачный, скорость героя)

> Разрушенная земля со смесью обломков трёх фракций под ногами. Вид сверху под крутым углом — камера наклонена вниз, но НЕ строго отвесно и НЕ сбоку (поверхность уходит вглубь к верхней кромке и темнеет там), равномерно, бесшовный тайл.

**Вариант 1 (`near.1.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the final "Battlefield" zone the
character walks on. Hand-crafted dark fantasy pixel art, cold desaturated chaotic palette.
Devastated earth seen from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view); the surface fills the whole band and recedes gently into the distance toward the top, fading darker at the top edge, mixing all three factions.
Evenly, uniformly detailed: faint-blue arcane crystal shards among iron chain links and horse bones, cracked scorched
stone with churned mud and rust flakes, magical burn marks over hoof and boot prints — distributed evenly.
No large unique landmark objects, no sky, no horizon. Opaque image.
A very wide, short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Mixed dark palette: ash #3a3a3a, rust #5a3a1a, crystal #3a3a6a, bone #5a5a4a.
```

**Вариант 2 (`near.2.png`):**
```
Generate a pixel-art GROUND/floor layer for a dark-fantasy battle game — the ground of the final "Battlefield" zone.
Hand-crafted dark fantasy pixel art, cold desaturated chaotic palette.
Devastated earth from a high oblique angle — a steep near-top-down view (camera tilted down, NOT straight overhead and NOT a side or elevation view; the surface recedes into the distance toward the top and fades darker at the top edge), with a DIFFERENT mix balance: more churned bloodied mud and rust over
scorched stone, fewer crystals, scattered broken iron plates, bone shards and a faint green miasma residue in the cracks
— evenly distributed, no large landmark objects. No sky, no horizon. Opaque image.
Very wide short horizontal band (8:1), seamlessly tileable left to right with no visible seam
(scrolls fastest). Mixed dark palette: ash #3a3a3a, rust #5a3a1a, miasma #0a2a0a, bone #5a5a4a.
```

---

## FORE — `fore.png` (передний план, альфа, очень быстрый)

> Рендерится только в нижней ~½ экрана (полоса ~8:1): ~7–8 средних силуэтов обломков всех фракций стоят на нижней
> кромке и растут вверх, ничего не свисает сверху. Прячется в бою.

**Вариант 1 (`fore.1.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the final
"Battlefield" zone passing right in front of the camera. Hand-crafted dark fantasy pixel art, very dark chaotic palette.
Fully transparent background — output a PNG with an alpha channel. Do NOT draw any sky, ground, crater fill or fog; all
empty space must be transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen, so every object must sit ON the bottom edge and
grow UPWARD from it — nothing may hang down from the top, float detached in the air, or touch the top edge; keep the
whole upper part of the strip fully transparent.
Draw about 7–8 separate medium-sized dark silhouettes standing along the bottom edge, spanning all factions: a cracked
rune-stone slab with faint blue glow, a big bleached ribcage, a toppled heap of rusted armor, a broken lance (vary these so there are roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail (very close to camera),
with small transparent gaps between them so they read as separate silhouettes.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #1a1a2a with #3a3a6a glow.
```

**Вариант 2 (`fore.2.png`):**
```
Generate a pixel-art FOREGROUND parallax layer for a dark-fantasy battle game — the close foreground of the final
"Battlefield" zone. Hand-crafted dark fantasy pixel art, very dark chaotic palette.
Fully transparent background — output a PNG with an alpha channel. No sky, ground, crater fill or fog; all empty space
transparent.
IMPORTANT: this layer is shown only across the LOWER HALF of the screen — every object sits ON the bottom edge and grows
UPWARD; nothing hangs from the top, floats detached, or touches the top edge; keep the upper part of the strip fully
transparent.
Draw about 7–8 separate medium-sized dark silhouettes along the bottom edge, a DIFFERENT three-faction set: a broken
wizard staff stuck upright glowing faint blue, a horse skull on a stake, a fused mound of armor and chains, a snapped
banner pole (vary these to roughly 7–8 distinct objects across the strip — every object different, with no repeated or duplicated shapes). Minimal internal detail, with
small transparent gaps between them.
Very wide horizontal strip, about 8:1 (roughly twice as wide as the other layers — a long thin band), seamlessly
tileable left to right. Near-black tones #1a1a2a with #3a3a6a glow.
```

---

## Палитра

| Элемент              | Hex       |
|----------------------|-----------|
| Магический фиолет.   | `#2a0a3e` |
| Гниль (миазмы)       | `#0a2a0a` |
| Дым                  | `#3a2a1a` |
| Молния               | `#6a6aaa` |
| Зона магии           | `#1a1a3a` |
| Зона конницы         | `#3a4a2a` |
| Зона мародёров       | `#4a2a1a` |
| Зола                 | `#3a3a3a` |
| Ржавчина             | `#5a3a1a` |
| Кристалл             | `#3a3a6a` |
| Кость                | `#5a5a4a` |
