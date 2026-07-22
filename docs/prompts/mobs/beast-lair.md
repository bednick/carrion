# Мобы: Логово зверей (Конница — Дикие звери, ★★☆)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney. Прозрачность просим напрямую
(PNG с альфой); если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

Контент зоны — [`docs/zones/beast-lair.md`](../../zones/beast-lair.md). Тема: **стая, которая доливается волнами** —
звери обжили кости и завели норы. Мотив зоны: **свалявшийся мех, кость, тусклый жёлтый блеск глаз из темноты**.

**Общие правила для всех мобов:**

- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя и смотрят на него), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези. Планку задаёт **спрайт героя**: высокодетальная «нарисованная» пиксель-графика,
  жирный тёмный контур, резкий свет сверху-слева, глубокие почти-чёрные тени, тёплая земляная палитра — грязь
  `#4a3a2a`, кожа/мех `#6a5a4a`, олива `#3a4a2a`, засохшая кровь `#5a2a2a`, кость `#c8c8b8`, контур `#1a1410`.
  Единственный акцент — **тусклый жёлто-янтарный блеск глаз** `#b8902a` (перекличка с far-слоем зоны). Никакого
  фиолетового некро-свечения — это чужая фракция.
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный кадр.** Полные листы (`idle/attack/hit/death` по `docs/art-spec.md`) — позже тем же описанием.
- Путь спрайтов: `public/sprites/mobs/<id>/base.png` (босс лежит там же, в `mobs/`). Все семь файлов зоны сейчас —
  копии заглушки `public/sprites/mobs/base.png` (83166 байт), их и заменяем. Размеры относительные; точные px не
  важны — отмасштабируем.

---

## Референсы (что прикладывать при генерации)

**Стилевой якорь всего звериного бестиария — спрайт героя**, а не старые спрайты крыс. Крысы («Растоптанные луга»)
нарисованы в более плоской и низкоконтрастной манере и тянут зону вниз; герой задаёт целевую планку. Крыса/мышь по
этой же причине **перегенерируется заново** — см. [`trampled-meadows.md`](trampled-meadows.md).

**Уровень A — якорь стиля** (прикладываем ВСЕГДА, первым файлом):

| Якорь         | Файл                                           | Для чего эталон                                                      |
|---------------|------------------------------------------------|----------------------------------------------------------------------|
| Силач (герой) | `public/sprites/characters/strongman/camp.png` | техника, контур, свет/тень, палитра, уровень детализации, **масштаб** |

> Герой на референсе смотрит ВПРАВО — в промте явно требуем **зеркально, лицом ВЛЕВО**.
> Рост задаём прозой относительно героя («about waist height to the man in the reference»).

**Уровень B — внутризонная цепочка** (вторым файлом, чтобы звери не разъезжались между собой):

- **Лютоволка генерим ПЕРВЫМ**, только от героя — он задаёт мех, морду и посадку головы для всей зоны. Затем его
  файл (`public/sprites/mobs/dire_wolf/base.png`) прикладываем к **Гиене, Волчице-матери, Вожаку стаи и Норе**.
- **Кабана-секача** генерим вторым (герой + `dire_wolf` ради фактуры шерсти); затем сам кабан
  (`public/sprites/mobs/boar/base.png`) — эталон для **Поросёнка**.
- **Звериная нора** — не зверь, а объект: форму задаём прозой, звери нужны лишь ради палитры и фактуры меха/кости.

Формулировка в промте (режим редактирования): *«Using the human warrior in the attached reference as a strict STYLE
anchor — same hand-painted high-detail pixel-art technique, same heavy dark outline, same hard light from the upper
left with deep near-black shadows, same gritty desaturated earth palette, same level of rendering — create a NEW
enemy: …»*.

**Порядок генерации:** `dire_wolf` → `boar` → `hyena`, `she_wolf`, `pack_leader` → `piglet` → `beast_den`.

---

## Лютоволк `dire_wolf` (тело своры) — генерить ПЕРВЫМ

> Поджарый волк из стаи, бьёт быстро и отскакивает. Базовое тело своры — им доска доливается от нор, волчицы и вожака.

- **Заменяемый файл:** `public/sprites/mobs/dire_wolf/base.png`
- **Референс:** `public/sprites/characters/strongman/camp.png`

```
Using the human warrior in the attached reference as a strict STYLE anchor — same hand-painted
high-detail pixel-art technique, same heavy dark outline, same hard light from the upper left
with deep near-black shadows, same gritty desaturated earth palette, same level of rendering
and the same sprite resolution — create a NEW subject that is NOT a human: a lean dire wolf
from a hunting pack. Long wiry legs built for lunging, narrow deep chest, ribs faintly showing
through matted grey-brown fur painted in distinct clumped strands rather than flat colour, a
ruff of coarser hair along the neck and shoulders, long muzzle with lips peeled back off
yellowed fangs, ears laid flat, head lowered level with the spine in a stalking crouch, tail
low and straight. Fast and hungry, not bulky. Grimy and real, like a starving animal.
Fur #6a5a4a, dirt #4a3a2a, dried blood #5a2a2a, bone #c8c8b8, outline #1a1410, dim amber eye
glint #b8902a.

Mirror the facing of the reference: side view, facing LEFT. Full body head to tail, standing,
centered, no ground plane and no cast shadow. Fully transparent background — output a PNG with
an alpha channel. Scale: about waist height to the man in the reference, long-bodied and lean.
```

## Кабан-секач `boar` (наскок + стартовая свора) — генерить вторым

> Ломится напролом, водит за собой выводок поросят. Живучести немного, но бьёт часто и сильно.

- **Заменяемый файл:** `public/sprites/mobs/boar/base.png`
- **Референсы:** `public/sprites/characters/strongman/camp.png` + `public/sprites/mobs/dire_wolf/base.png`
  (сгенерённый)

```
Using the human warrior in the attached reference as a strict STYLE anchor — same hand-painted
high-detail pixel-art technique, same heavy dark outline, same hard light from the upper left
with deep near-black shadows, same gritty desaturated earth palette, same level of rendering —
and the second reference for the fur and creature treatment, create a NEW subject that is NOT
a human: a massive wild tusker boar that charges straight through anything. Enormous humped
shoulders and a thick armoured neck tapering to small hindquarters, short stumpy legs, coarse
black-brown bristles standing up along the spine painted strand by strand, hide crusted with
dried mud and criss-crossed with old white scars, a blunt snout with two long upward-curving
yellowed tusks, small furious sunken eye, head lowered mid-charge. Brutal and heavy, all
forward momentum. Bristles #4a3a2a, hide #6a5a4a, dried blood #5a2a2a, tusk bone #c8c8b8,
outline #1a1410, dim amber eye glint #b8902a.

Mirror the facing of the reference: side view, facing LEFT. Full body, centered, no ground plane
and no cast shadow. Fully transparent background — output a PNG with an alpha channel. Scale:
about waist height to the man in the reference but two to three times the mass of the wolf.
```

## Гиена `hyena` (чип-мультиатака)

> Трусливая падальщица по краю стаи, рвёт добычу мелкими быстрыми укусами с двух заходов.

- **Заменяемый файл:** `public/sprites/mobs/hyena/base.png`
- **Референсы:** `public/sprites/characters/strongman/camp.png` + `public/sprites/mobs/dire_wolf/base.png`
  (сгенерённый)

```
Using the human warrior in the attached reference as a strict STYLE anchor — same hand-painted
high-detail pixel-art technique, same heavy dark outline, same hard light from the upper left
with deep near-black shadows, same gritty desaturated earth palette, same level of rendering —
and the second reference (the pack wolf) for fur treatment and creature proportions, create a
NEW enemy: a cowardly scavenging hyena that circles the edge of the pack. Distinctive sloping
back — tall powerful shoulders dropping away to low weak hindquarters, thick blunt neck,
oversized crushing jaws too big for the skull, short round ears, blotchy spotted dirty-tan coat
with a coarse bristling mane along the spine, muzzle stained dark with old blood, body twisted
slightly away as if ready to bolt. Ugly, nervous, opportunistic. Fur #6a5a4a, dirt #4a3a2a,
dried blood #5a2a2a, outline #1a1410, dim amber eye glint #b8902a.

Mirror the facing of the reference: side view, facing LEFT. Full body, standing, centered, no
ground plane and no cast shadow. Fully transparent background — output a PNG with an alpha
channel. Scale: slightly shorter than the wolf but heavier in the shoulders.
```

## Волчица-мать `she_wolf` (периодический призыв)

> Держит выводок при себе и почти не лезет в драку — раз за разом выводит из норы новых лютоволков.

- **Заменяемый файл:** `public/sprites/mobs/she_wolf/base.png`
- **Референсы:** `public/sprites/characters/strongman/camp.png` + `public/sprites/mobs/dire_wolf/base.png`
  (сгенерённый)

```
Using the human warrior in the attached reference as a strict STYLE anchor — same hand-painted
high-detail pixel-art technique, same heavy dark outline, same hard light from the upper left
with deep near-black shadows, same gritty desaturated earth palette, same level of rendering —
and the second reference (the pack wolf) as the species template, create a NEW enemy: an old
breeding she-wolf that guards her litter instead of fighting. Clearly the same species as the
wolf reference but heavier and older — broader barrel chest, thicker shaggier coat gone
grizzled grey at the muzzle and ruff, sagging underbelly with swollen teats, torn notched ear,
one old scar across the shoulder. Head held HIGH and turned back over the shoulder in a
summoning howl, jaws open, throat extended, weight settled back on the haunches — a calling
pose, not an attacking one. Fur #6a5a4a, dirt #4a3a2a, grizzled grey #8a8478, outline #1a1410,
dim amber eye glint #b8902a.

Mirror the facing of the reference: side view, facing LEFT. Full body, standing, centered, no
ground plane and no cast shadow. Fully transparent background — output a PNG with an alpha
channel. Scale: noticeably larger and heavier than the common wolf.
```

## Вожак стаи `pack_leader` — босс

> Матёрый лютоволк, под которым ходит вся свора. В первый ряд не лезет — гонит на героя стаю и добивает обескровленного.

- **Заменяемый файл:** `public/sprites/mobs/pack_leader/base.png`
- **Референсы:** `public/sprites/characters/strongman/camp.png` + `public/sprites/mobs/dire_wolf/base.png`
  (сгенерённый)

```
Using the human warrior in the attached reference as a strict STYLE anchor — same hand-painted
high-detail pixel-art technique, same heavy dark outline, same hard light from the upper left
with deep near-black shadows, same gritty desaturated earth palette, same level of rendering —
and the second reference (the pack wolf) as the species template, create a NEW BOSS enemy: the
alpha of the pack, a huge battle-scarred dire wolf that commands the swarm. Same species as the
wolf reference but far bigger and thicker: massive shoulders under a heavy shaggy black-grey
mane, deep chest, scarred hide showing through worn patches of fur, one ear shredded, a jagged
old wound across the flank, muzzle greyed and streaked with dried blood, enormous cracked fangs.
Standing tall and still, head raised, weight square on all four legs, looking down its nose —
commanding, not lunging. A few gnawed bones and torn scraps of horse harness snagged in the fur
of its ruff. Fur #6a5a4a, dark mane #2a2a1a, dirt #4a3a2a, dried blood #5a2a2a, bone #c8c8b8,
outline #1a1410, bright amber eye glint #b8902a.

Mirror the facing of the reference: side view, facing LEFT. Full body head to tail, standing,
centered, no ground plane and no cast shadow. Fully transparent background — output a PNG with
an alpha channel. Scale: a boss — half again the size of the common wolf, shoulder as high as
the chest of the man in the reference.
```

## Поросёнок `piglet` (призывное тело своры)

> Мелкий кабанчик из выводка секача. Сам в бою не появляется — только призывается стартовой волной.

- **Заменяемый файл:** `public/sprites/mobs/piglet/base.png`
- **Референсы:** `public/sprites/characters/strongman/camp.png` + `public/sprites/mobs/boar/base.png` (сгенерённый)

```
Using the human warrior in the attached reference as a strict STYLE anchor — same hand-painted
high-detail pixel-art technique, same heavy dark outline, same hard light from the upper left
with deep near-black shadows, same gritty desaturated earth palette, same level of rendering —
and the second reference (the tusker boar) as the species template, create a NEW enemy: a small
wild piglet from the same brood, clearly the same species, just young. Round stubby body,
oversized head and ears for its size, tiny stumpy legs, soft striped brownish bristle coat,
snout with only tiny nub tusks barely showing, wide-eyed and aggressive despite its size, front
trotters braced mid-scamper. Weak alone, dangerous in numbers. Hide #6a5a4a, dirt #4a3a2a,
outline #1a1410, dim amber eye glint #b8902a.

Mirror the facing of the reference: side view, facing LEFT. Full body, centered, no ground plane
and no cast shadow. Fully transparent background — output a PNG with an alpha channel. Scale:
small — about knee height to the man in the reference, roughly a quarter of the adult boar.
```

## Звериная нора `beast_den` (чистый спавнер)

> Не зверь, а само логово: земляная нора, из которой без устали лезет зверьё. Стоит в тылу.

- **Заменяемый файл:** `public/sprites/mobs/beast_den/base.png`
- **Референсы:** `public/sprites/characters/strongman/camp.png` + `public/sprites/mobs/dire_wolf/base.png`
  (сгенерённый; только палитра/фактура — форму задаём прозой)

```
Using the human warrior in the attached reference as a strict STYLE anchor — same hand-painted
high-detail pixel-art technique, same heavy dark outline, same hard light from the upper left
with deep near-black shadows, same gritty desaturated earth palette, same level of rendering —
and the second reference only for fur and bone texture, create a NEW subject that is NOT a
creature: a beast den, a dug-out burrow mouth built into a mound of packed earth. A dark ragged
hole in the middle of a low earth mound, its rim reinforced with a tangle of gnawed horse and
human bones and dry roots, clumps of torn fur and old dried blood matted around the entrance,
claw-raked scratches in the dirt, splintered rib bones scattered at the base. Deep inside the
black opening: only a snarling muzzle and two dim amber eye glints of something about to come
out. Menacing, alive, unmistakably a spawn point. Earth #4a3a2a, fur #6a5a4a, bone #c8c8b8,
dried blood #5a2a2a, outline #1a1410, eye glint #b8902a.

Side view of the mound with the burrow mouth opening toward the LEFT. The mound itself is the
whole sprite — centered, no ground plane and no cast shadow. Fully transparent background —
output a PNG with an alpha channel. Scale: wide and low — about waist height to the man in the
reference but broader than any of the beasts.
```
