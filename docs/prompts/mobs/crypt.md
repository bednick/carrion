# Мобы: Склеп (Магия — Нежить, ★★☆)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney. Прозрачность просим напрямую
(PNG с альфой); если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

Контент зоны — [`docs/zones/crypt.md`](../../zones/crypt.md). Тема: **прерванное погребение** — мертвецы поднялись
сами, голодные, многорукие, неупокоенные. Мотив зоны: **гниль, лохмотья-саваны, бестелесные призраки, проклятия**
(в отличие от рунных конструктов «Руин магов»).

**Общие правила для всех мобов:**

- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя и смотрят на него), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези, холодная десатурированная палитра. База — серо-фиолетовая некро-палитра «Мёртвых
  полей»: гниль/пепел `#6a6a7a`, кость `#c8c8d8`, тьма `#2a2a3e`; **фиолетовое некро-свечение** `#9a3ad8` как
  единственный яркий акцент (матчим готовые спрайты).
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный idle-кадр.** Полные листы (`idle/attack/hit/death` по `docs/art-spec.md`) — позже тем же
  описанием.
- Путь спрайтов: `public/sprites/mobs/<id>/idle.png` (боссы — `public/sprites/bosses/<id>/`). Размеры относительные;
  точные px не важны — отмасштабируем.

---

## Референсы (что прикладывать при генерации)

Склеп — та же фракция Магии, что и уже отрисованные «Мёртвые поля», поэтому генерим **в режиме редактирования от
готовых спрайтов-якорей**. Стратегия двухуровневая.

**Уровень A — стилевые якоря** (готовые спрайты нежити; берём 1–2 ближайших к мобу). Держат палитру, пропорции,
вид сбоку, пиксель-стиль, яркость свечения:

| Якорь              | Файл                                           | Для чего эталон                                             |
|--------------------|------------------------------------------------|-------------------------------------------------------------|
| Поднятый пехотинец | `public/sprites/mobs/raised_infantry/base.png` | гниющая плоть, лохмотья, саваны — **основной якорь Склепа** |
| Сержант            | `public/sprites/mobs/sergeant/base.png`        | доспех, фиолетовое свечение — для латника и масштаба босса  |
| Скелет             | `public/sprites/mobs/skeleton/base.png`        | костяной каркас — как основа для призрака                   |

**Уровень B — внутризонная цепочка.**

- **Упыря генерим ПЕРВЫМ** — он задаёт «самоподнявшуюся» гниль; затем его файл прикладываем к Многорукому и
  Неупокоенному.
- **Тень погребённого** — призрак, готового эталона нет: генерим от `skeleton` как просвечивающего каркаса + сильная
  прозрачность тела; затем сама Тень становится эталоном для **Плакальщика**.

Формулировка в промте (режим редактирования): *«Using the undead creature in the attached reference image(s) as a
strict style anchor — same hand-crafted pixel-art technique, same cold grey-purple palette, same violet necrotic
glow, same proportions and left-facing side view — create a NEW enemy: …»*.

Спрайт героя как референс масштаба **не прикладываем** — якоря уже отмасштабированы под героя; рост задаём прозой.

---

## Упырь `ghoul` (common)

> Трупоед, бьющий обеими лапами. **Генерить первым** (эталон «самоподнявшейся» гнили для зоны).

**Референс:** `raised_infantry/base.png`.

```
Using the rotting undead in the attached reference as a strict style anchor (same pixel-art
technique, cold grey-purple palette, proportions, left-facing side view), create a NEW enemy:
a corpse-eating ghoul that clawed its way up on its own. Gaunt grey rotting flesh stretched
tight over bone, long grasping arms ending in filthy claws, BOTH hands raised to strike,
hollow eye sockets with a faint cold purple gleam, jaw gnashing with broken teeth, a wild
starved hunched posture. Feral and hungry, NOT armored. Rot #6a6a7a, bone #c8c8d8, dark
#2a2a3e, faint violet glow #9a3ad8.

Side view, facing LEFT, full body head to toe, standing hunched, centered. Hand-crafted
pixel art. Fully transparent background — output a PNG with an alpha channel. Human height,
hunched.
```

## Многорукий мертвец `many_armed_dead` (uncommon)

> Несколько трупов срослись в одну голодную тушу с лишними руками — апекс мультиатаки, прямо из лора.

**Референс:** `raised_infantry/base.png` + сгенерённый `ghoul`.

```
Using the rotting ghoul in the attached reference as a strict style anchor (same pixel-art
technique, grey-purple palette, left-facing side view), create a NEW enemy: a grotesque
undead mass of several corpses fused into one bloated hungry body, with MANY extra arms —
four to six — sprouting at odd angles, each ending in clawing rotten hands reaching outward.
Multiple slack rotting faces on the lumpen torso, faint cold purple gleam in the sockets. A
writhing multi-armed horror. Rot #6a6a7a, bone #c8c8d8, dark #2a2a3e, faint violet glow
#9a3ad8.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Bulkier and taller than a single
ghoul.
```

## Погребённый латник `buried_knight` (uncommon)

> Труп латника в целом доспехе. Медленный, тяжёлый одиночный удар. Танк-контраст мультиатаке.

**Референс:** `sergeant/base.png` (сильный якорь — почти та же роль).

```
Using the armored undead in the attached reference as a strict anchor — match its tarnished
dark plate style and violet joint-glow — create a NEW enemy: a dead man-at-arms risen in full
funerary plate. Tarnished dark armor buckled over rotting flesh, a closed battered helm, one
heavy sword or mace held low, a stiff clumsy heavy stance. Faint violet necrotic glow leaks
at the armor joints. Slower and more intact than common dead, a heavy tank. Dark plate
#2a2a3e, tarnish #6a6a7a, violet glow #9a3ad8.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Human height, bulky and heavy.
```

## Неупокоенный `unquiet_dead` (common) + Форма 2 `unquiet_risen`

> Обряд упокоения оборвали — падает и встаёт снова один раз. Две формы.

**Референс:** `raised_infantry/base.png` (+ `ghoul` для гнили).

### Форма 1 `unquiet_dead`

```
Using the rotting undead in the attached reference as a strict style anchor (same pixel-art
technique, grey-purple palette, left-facing side view), create a NEW enemy: a restless corpse
that refuses to stay buried. A plain grey rotting body still tangled in torn burial
shroud-wrappings, arms reaching forward, shambling; faint cold purple gleam in the eyes.
Simpler and more wretched than a soldier — a common dead wrapped for a burial that never
finished. Rot #6a6a7a, shroud #c8c8d8, dark #2a2a3e, faint violet glow #9a3ad8.

Side view, facing LEFT, full body, shambling, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Human height.
```

### Форма 2 `unquiet_risen` (восстал после «гибели»)

```
Using the same rotting corpse style, create the SAME undead AFTER it has fallen and dragged
itself up again — more broken this time: half its burial shroud torn away exposing grey bone,
one arm hanging limp, hunched lower and dragging a leg, the purple eye-gleam noticeably
brighter. Clearly "gotten back up" and more ruined. Rot #6a6a7a, bone #c8c8d8, dark #2a2a3e,
brighter violet glow #9a3ad8.

Side view, facing LEFT, full body, hunched and dragging, centered. Hand-crafted pixel art.
Fully transparent background — output a PNG with an alpha channel. Human height, battered.
```

## Тень погребённого `buried_shade` (uncommon)

> Полубестелесный дух неупокоенного; уклоняется от удара, когда развоплощён. Новый визуал — потом эталон Плакальщика.

**Референс:** `skeleton/base.png` (иссохший каркас) — визуал новый. Спрайт рисуем **непрозрачным**;
эффект «сквозь духа видно» ставит движок (`sprite.setAlpha(~0.7)` при интеграции), поэтому фон — плоская магента
под `chroma_key.py`, а не альфа. Потом эталон Плакальщика.

```
Using the skeleton in the attached reference only as a loose anchor for the withered form and
grey-purple palette, create a NEW enemy: a ghostly shade of the unburied dead. A gaunt spectral
figure; its faint withered skeletal frame reads as pale glowing bone-lines painted WITHIN its
hazy body; its lower half frays into wisps of cold purple mist instead of legs; hollow glowing
violet eyes; reaching spectral arms. Ethereal, drifting, no solid ground contact.

Render it as SOLID, FULLY OPAQUE pixel art — every pixel is opaque paint. Do NOT make the body
see-through or translucent; convey the ghostly look through pale luminous colours, a soft
glowing rim-light, and a ragged silhouette whose misty lower edge dissolves by THINNING OUT
into fewer scattered pixels (dithering), never by lowering opacity. Pale luminous ghost-grey
#c8c8d8, dark #2a2a3e, violet spectral glow #9a3ad8.

Side view, facing LEFT, full figure, floating upright, centered. Hand-crafted pixel art.

The background must be a SINGLE FLAT SOLID magenta colour #FF00FF filling the entire canvas,
perfectly uniform. No checkerboard, no grid of squares, no grey-and-white transparency pattern,
no gradient, no shading, no texture behind the figure — just one solid magenta fill. Human
height but floating.
```

## Плакальщик `wailer` (uncommon)

> Стенающий погребальный дух: воет и накладывает проклятие, ослабляющее героя.

**Референс:** сгенерённая `buried_shade` + `raised_infantry/base.png` (саваны). Спрайт **непрозрачный**;
полупрозрачность — в движке (`sprite.setAlpha(~0.7)`), фон — магента под `chroma_key.py`.

```
Using the ghostly mourner in the attached reference as a strict style anchor (same grey-purple
palette, violet glow, left-facing side view, pixel-art technique), create a NEW enemy: a
wailing funerary spirit. A gaunt spectral mourner draped in tattered grave-shrouds, mouth
stretched impossibly wide in an endless silent scream, bony clawed hands clutched to the sides
of its head, thin lower body frays downward into wisps of cold purple mist. Hollow glowing
violet eyes streaming faint spectral tears.

Render it as SOLID, FULLY OPAQUE pixel art — every pixel is opaque paint. Do NOT make the body
see-through or translucent; convey the ghostly look through pale luminous colours, a soft
glowing rim-light, and a ragged silhouette whose misty lower edge dissolves by THINNING OUT
into fewer scattered pixels (dithering), never by lowering opacity. Pale luminous shroud
#c8c8d8, dark #2a2a3e, bright violet spectral glow #9a3ad8.

Side view, facing LEFT, full figure, floating, centered. Hand-crafted pixel art.

The background must be a SINGLE FLAT SOLID magenta colour #FF00FF filling the entire canvas,
perfectly uniform. No checkerboard, no grid of squares, no grey-and-white transparency pattern,
no gradient, no shading, no texture behind the figure — just one solid magenta fill. Human
height, floating, mournful.
```

## Бальзамировщик `embalmer` — босс (rare) + Фаза 2 `swaddled_horror`

> Жрец-ритуалист, прерванный на середине обряда. При «гибели» доводит обряд на себе → спелёнутый ужас. Две фазы.

**Референс:** `raised_infantry/base.png` (робы-ритуалист) + `sergeant/base.png` (масштаб босса).

### Фаза 1 — Бальзамировщик `embalmer`

```
Using the grey-purple undead style of the attached references as a strict anchor (same
pixel-art technique, palette, violet glow), create a NEW BOSS enemy: an undead ritualist
priest interrupted mid-rite. A tall gaunt figure in ornate dark funerary robes and a ritual
mask or headdress, holding embalming tools and a curved ritual dagger, wrappings and swirling
cold purple curse-energy hovering around it in a commanding cursing gesture. Ceremonial,
imposing, sinister. Robe #2a2a3e, bone/mask #c8c8d8, ash #6a6a7a, violet curse-energy #9a3ad8.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Larger than common troops,
boss-sized.
```

### Фаза 2 — Спелёнутый ужас `swaddled_horror`

```
Using the same boss figure as the attached reference, create the SAME priest AFTER finishing
the rite upon himself: now a towering mummified horror fully wrapped head to toe in tight
burial bandages — a hulking swaddled silhouette, faceless bound head, thick purple necrotic
energy bleeding out through the wrappings, one massive crushing arm raised. Slow, monstrous,
overwhelming. Bandage #c8c8d8/#6a6a7a, dark #2a2a3e, seeping violet glow #9a3ad8.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Boss-sized, heavier and taller
than phase 1.
```
