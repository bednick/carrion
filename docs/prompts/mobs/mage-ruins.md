# Мобы: Руины магов (Магия — Нежить, ★★☆)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney.
Прозрачность просим напрямую (PNG с альфой);
если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

Контент зоны — [`docs/zones/mage-ruins.md`](../../zones/mage-ruins.md). Тема: **рунная техно-некромантия** —
маг осознанно собрал боевой арсенал из костей. Мотив зоны: **кость + светящиеся фиолетовые руны**.

**Общие правила для всех мобов:**

- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя и смотрят на него), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези, холодная десатурированная палитра. База — серо-фиолетовая некро-палитра «Мёртвых
  полей»: кость `#c8c8d8`, пепел `#6a6a7a`, тьма `#2a2a3e`; **яркое фиолетовое некро-свечение** `#9a3ad8` как
  единственный яркий акцент (матчим готовые спрайты, а не приглушаем).
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный idle-кадр.** Полные листы (`idle/attack/hit/death` по `docs/art-spec.md`) — позже тем же
  описанием.
- Путь спрайтов: `public/sprites/mobs/<id>/idle.png` (боссы — `public/sprites/bosses/<id>/`). Размеры относительные;
  точные px не важны — отмасштабируем.

---

## Референсы (что прикладывать при генерации)

Обе зоны Магии — та же фракция, что уже отрисованные «Мёртвые поля», поэтому генерим **в режиме редактирования от
готовых спрайтов-якорей**, а не с нуля. Стратегия двухуровневая.

**Уровень A — стилевые якоря** (готовые спрайты нежити; берём 1–2 ближайших к мобу, не все сразу). Держат палитру,
пропорции, вид сбоку, пиксель-стиль, яркость свечения:

| Якорь              | Файл                                           | Для чего эталон                              |
|--------------------|------------------------------------------------|----------------------------------------------|
| Скелет             | `public/sprites/mobs/skeleton/base.png`        | кость, худые пропорции, свечение в глазницах |
| Поднятый пехотинец | `public/sprites/mobs/raised_infantry/base.png` | робы/лохмотья, каст-силуэт                   |
| Сержант            | `public/sprites/mobs/sergeant/base.png`        | доспех, фиолетовое свечение, масштаб босса   |

**Уровень B — внутризонная цепочка.** **Рунный скелет генерим ПЕРВЫМ** — он задаёт, как выглядят светящиеся руны на
кости. Затем его файл (`public/sprites/mobs/rune_skeleton/idle.png`) прикладываем ко **всем остальным рунным мобам**
зоны, чтобы руны/свечение были единообразны.

Формулировка в промте (режим редактирования): *«Using the undead creature in the attached reference image(s) as a
strict style anchor — same hand-crafted pixel-art technique, same cold grey-purple palette, same bright violet
necrotic glow, same proportions and left-facing side view — create a NEW enemy: …»*.

Спрайт героя как референс масштаба **не прикладываем** — якоря уже отмасштабированы под героя; рост задаём прозой.

---

## Рунный скелет `rune_skeleton` (common)

> Скелет с вплавленными рунными метками. Маг поднял его осознанно — собраннее рядовой нежити. **Генерить первым**
> (эталон рун для зоны).

**Референс:** `skeleton/base.png`.

```
Using the fleshless skeleton in the attached reference as a strict style anchor (same
pixel-art technique, cold grey-purple palette, proportions, left-facing side view), create
a NEW upgraded undead: a purpose-built runic skeleton soldier. Glowing violet runic sigils
are branded deep into its bones — across the skull, ribs and forearms — emitting a bright
cold purple light. It stands more upright, collected and deliberate than a mindless corpse,
a few scraps of dark magic-faction cloth still hanging. Bone #c8c8d8, ash #6a6a7a, dark
#2a2a3e, bright violet rune glow #9a3ad8.

Side view, facing LEFT, full body head to toe, standing, centered. Hand-crafted pixel art.
Fully transparent background — output a PNG with an alpha channel. Roughly human height,
lean.
```

## Рунная гончая `rune_hound` (common)

> Костяной зверь, сцепленный из костей павших коней и псов — не живой хищник, а конструкт. Давит темпом.

**Референс:** `skeleton/base.png` + сгенерённый `rune_skeleton`.

```
Using the runic skeleton in the attached reference as a strict style anchor (same pixel-art
technique, cold grey-purple palette, bright violet rune glow, left-facing side view), create
a NEW enemy: a four-legged bone construct assembled from the mismatched skulls and bones of
fallen horses and hounds, fused into one lean predatory beast. Glowing violet runes bind the
mismatched bones together at the joints; an elongated skull with too many teeth; a low,
lunging, aggressive stance. This is NOT a living animal — bare bone and rune, a built hound.
Bone #c8c8d8, dark #2a2a3e, violet rune glow #9a3ad8.

Side view, facing LEFT, full body, standing low to the ground, centered. Hand-crafted pixel
art. Fully transparent background — output a PNG with an alpha channel. Roughly the size of
a large dog, long and low.
```

## Рунный лучник `rune_archer` (uncommon) + Костяная стена `bone_wall`

> Хрупкий стрелок из рунных костей; в начале боя ставит перед собой костяную стену и бьёт из-за неё. Два спрайта.

**Референс:** `skeleton/base.png` + `rune_skeleton`.

### Лучник `rune_archer`

```
Using the runic skeleton in the attached reference as a strict style anchor (same pixel-art
technique, cold grey-purple palette, bright violet rune glow, left-facing side view), create
a NEW enemy: a skeletal archer of runed bone. It draws a bow strung with dried sinew and
wears a quiver of bone arrows on its back; glowing violet runes run along its arms and the
bow limbs; a poised, aiming, drawn-back stance leaning slightly forward. Lean and light.
Bone #c8c8d8, ash #6a6a7a, dark #2a2a3e, violet rune glow #9a3ad8.

Side view, facing LEFT, full body, standing and aiming, centered. Hand-crafted pixel art.
Fully transparent background — output a PNG with an alpha channel. Human height, thin.
```

### Костяная стена `bone_wall` (призыв, не атакует)

```
Using the same grey-purple runic bone style as the attached reference, create a NEW object
(not a creature): a crude defensive rampart built of stacked bones, skulls and rib-cages
lashed and fused together, bound by glowing violet runes. A squat, wide, solid bone
barricade a little taller than a man — no face, no limbs, purely a barrier wall. Its broad
protective face is turned to the LEFT (toward the hero it shields against); shown from a
side or three-quarter angle so the wall has depth and clearly faces left, not flat toward
the viewer. Bone #c8c8d8, dark #2a2a3e, violet rune glow #9a3ad8.

Side / three-quarter view, the barrier facing LEFT, upright, centered. Hand-crafted pixel
art. Fully transparent background — output a PNG with an alpha channel. A bit taller than a
human, wide and heavy.
```

## Костяной конструкт `bone_construct` (uncommon)

> Голем из костей нескольких тел. Медленный, тяжёлый удар.

**Референс:** `skeleton/base.png` (+ `sergeant/base.png` для массы).

```
Using the grey-purple undead style of the attached references as a strict anchor (same
pixel-art technique, palette, violet glow, left-facing side view), create a NEW enemy: a
hulking golem assembled from the bones of many bodies fused into one massive humanoid mass.
Oversized and broad, with huge slab-like bone arms ending in heavy crushing claws; violet
runes glow deep in the gaps between the packed bones; a slow, heavy, hunched stance. Bone
#c8c8d8, ash #6a6a7a, dark #2a2a3e, violet rune glow #9a3ad8.

Side view, facing LEFT, full body, standing, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Clearly bigger and bulkier than
a man.
```

## Костяная многоножка `bone_centipede` (uncommon) + Костяной обрубок `bone_stub`

> Длинный конструкт из десятков мелких костей; при смерти рассыпается на обрубки. Два спрайта.

**Референс:** `skeleton/base.png` + `rune_skeleton`.

### Многоножка `bone_centipede`

```
Using the runic bone style of the attached reference as a strict anchor (same pixel-art
technique, grey-purple palette, violet rune glow, left-facing side view), create a NEW enemy:
a long segmented construct built from dozens of small bones linked into a crawling
centipede-like body — many little bone legs down its length, a skull-like head with
mandibles at the front. Glowing violet runes bind every segment joint. Low, elongated,
serpentine, crawling forward. Bone #c8c8d8, dark #2a2a3e, violet rune glow #9a3ad8.

Side view, facing LEFT, full segmented body, crawling low, centered. Hand-crafted pixel art.
Fully transparent background — output a PNG with an alpha channel. Long and low to the
ground.
```

### Костяной обрубок `bone_stub` (при смерти)

```
Using the same runic bone style, create a NEW small enemy: a broken-off segment of the bone
centipede — a short twitching chunk of a few linked bones and little legs, a fragment of
skull, faint violet rune glow at the joints. Small, low, restless. Bone #c8c8d8, dark
#2a2a3e, violet rune glow #9a3ad8.

Side view, facing LEFT, full body, low to the ground, centered. Hand-crafted pixel art.
Fully transparent background — output a PNG with an alpha channel. Small, roughly knee-high.
```

## Костяной боевой маг `bone_battlemage` (rare)

> Поднятый рядовой чародей магической пехоты. Ведёт огонь двумя полосками рунных снарядов — эхо босса.

**Референс:** `skeleton/base.png` + `raised_infantry/base.png` (робы) + `rune_skeleton`.

```
Using the grey-purple undead style of the attached references as a strict anchor (same
pixel-art technique, palette, bright violet glow, left-facing side view), create a NEW enemy:
a skeletal battle-mage of the dead magic infantry. It wears the tattered robes and hood of a
field caster over a runed skull, and raises bony hands wreathed in crackling violet runic
energy; two small glowing rune-circles hover at its palms and a couple of conjured bone
shards orbit it. A menacing caster stance. Bone #c8c8d8, robe ash #6a6a7a, dark #2a2a3e,
bright violet rune energy #9a3ad8.

Side view, facing LEFT, full body, standing and casting, centered. Hand-crafted pixel art.
Fully transparent background — output a PNG with an alpha channel. Human height, robed.
```

## Призыватель костей `bone_summoner` — босс (rare)

> Лейтенант мага-командира. Призывает двух рунных скелетов и ведёт огонь двумя полосками костяных снарядов.

**Референс:** `raised_infantry/base.png` (робы-каст) + `sergeant/base.png` (масштаб босса) + `rune_skeleton`.

```
Using the grey-purple undead style of the attached references as a strict anchor (same
pixel-art technique, palette, bright violet glow), create a NEW BOSS enemy: an undead
necromancer-lieutenant. A tall, imposing skeletal commander draped in heavy ragged dark
robes with a small bone crown and faded officer insignia, hovering slightly off the ground,
arms spread in a commanding gesture. Bright violet runic energy swirls around it, shards of
bone orbit its body, and two spectral bone projectiles are forming at its sides; glowing
violet runes cover its exposed bones. Grand, ceremonial, undead-officer presence. Bone
#c8c8d8, robe ash #6a6a7a, dark #2a2a3e, bright violet rune energy #9a3ad8.

Side view, facing LEFT, full body, floating upright, centered. Hand-crafted pixel art. Fully
transparent background — output a PNG with an alpha channel. Larger and grander than common
troops, boss-sized.
```
