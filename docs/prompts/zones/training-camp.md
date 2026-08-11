# Промпт: Тренировочный лагерь (Training Camp) — обучающая зона, без фракции

**Генерация:** Nano Banana — естественный язык, без флагов Midjourney; «негатив» прозой. Общие правила и 4-слойная
модель — [`_style-guide.md`](../_style-guide.md). Для этой зоны генерируем в первом заходе только `far`/`near`
(по 1 варианту) — `mid`/`fore` (пулы объектов) можно добавить позже, зона это допускает (движок без них рисует
только far/near, `ExpeditionScene.buildScatterLayer` пропускает пустые слои).

## Атмосфера (лор)

Двор у самого костра лагеря, огороженный сколоченным частоколом — здесь новичков учат держать оружие прежде, чем
отпустить за край поля. Не поле битвы: земля утоптанная, не выжженная, воткнуты учебные столбы с чучелами и
клетка с пленником у забора. Сумерки, тусклый костровой свет и пара факелов на кольях — не лунный магический
свет, как на настоящих зонах. Палитра та же холодная десатурированная база проекта, но тон приземлённый, бытовой,
без некротического свечения/тумана.

---

## FAR — небо/дальний план (непрозрачный, медленный)

**Заменяемый файл:** `public/backgrounds/zones/training-camp/far.1.webp` (генерить в PNG, класть как WebP `-q 85`)
**Референсы:** `public/backgrounds/zones/abandoned-camp/far.1.webp` (стиль far-слоя, пропорции, горизонт),
`public/backgrounds/zones/dead-fields/far.1.webp` (небо/градиент)

Сгенерирован (2928×352):
```
Using the attached image as the exact style reference — same hand-crafted pixel-art
technique, same cold desaturated dark-fantasy palette, same very wide strip proportions,
same horizon height and same silhouette-style rendering of distant structures — generate
a NEW far background layer for a different zone: the "Training Camp", a mundane fenced
practice yard just outside the player's own mercenary camp. Not a battlefield: calm, lived-in,
dusk.

Content along the horizon: a low sagging wooden palisade of rough split logs running the
whole width, a plain gate frame, a couple of dim torches on posts glowing warm orange
against the cold sky, one leaning watch post, faint smoke haze drifting up from a campfire
just out of frame. Overcast grey-blue dusk sky above, no moon, no magical glow, no
necrotic purple. Keep every distinct distant shape different — no repeated silhouettes,
vary fence height and lean.

Sky and distant fence line ONLY — no ground detail in the foreground band, no large close-up
objects, no characters, no UI, no text, no frames or borders. Opaque image, no transparency.
Very wide horizontal strip, about 8:1, tiling seamlessly left to right (left and right edges
must match).
Palette approximately: #1a1a2e sky, #3a3a4a cold grey-blue, #c88a44 torch light,
#3a2e22 dark wood.
```

---

## NEAR — земля (непрозрачный, скорость героя)

**Заменяемый файл:** `public/backgrounds/zones/training-camp/near.1.webp`
**Референсы:** `public/backgrounds/zones/trampled-meadows/near.1.webp` (угол камеры, плотность деталей,
бесшовность), `public/backgrounds/zones/abandoned-camp/near.1.webp` (земля обитаемого лагеря)

Сгенерирован (2544×416):
```
Using the attached image as the exact style reference — same hand-crafted pixel-art
technique, same steep oblique near-top-down camera angle, same very wide short band
proportions, same even uniform detail density, same darkening toward the top edge —
generate a NEW ground layer for a different zone: the packed dirt yard of a "Training Camp",
a mundane fenced practice yard outside a mercenary camp.

Surface: hard-packed trodden brown earth, not cracked dead soil and not burnt ground —
lived-in and worn. Scuffed dirt, faint boot-worn ruts and drag marks, scattered wood chips,
loose straw wisps and a few splintered practice-stave fragments, a couple of shallow puddles
of muddy water. All of it distributed evenly across the whole width — no large unique
landmark object, no single focal point, nothing that would look wrong when the layer repeats.
No bones, no skulls, no magical glow, no purple.

The surface fills the entire band and recedes gently toward the top, fading darker there.
No sky, no horizon line, no fence, no characters, no text, no borders. Opaque image, no
transparency.
Very wide short horizontal band, about 6:1, tiling seamlessly left to right (left and right
edges must match exactly — this layer scrolls fastest).
Palette approximately: #3a2e22 packed earth, #5a4a38 lighter dirt, #8a7a4a straw and wood
chips, cold desaturated overall.
```

---

## Палитра

| Элемент          | Hex       |
|-------------------|-----------|
| Сумеречное небо    | `#1a1a2e` |
| Холодный серо-синий| `#3a3a4a` |
| Свет факела        | `#c88a44` |
| Утоптанная земля    | `#3a2e22` |
| Земля светлее       | `#5a4a38` |
| Солома/щепа         | `#8a7a4a` |
