# Мобы: Тренировочный лагерь (обучающая зона, без фракции)

**Генерация:** Nano Banana (Gemini image). Естественный язык, без флагов Midjourney. Прозрачность просим напрямую (PNG с альфой); если фон запечётся — убрать внешним инструментом / `tools/chroma_key.py`.

**Общие правила для всех мобов:**
- **Боковой вид, лицом ВЛЕВО** (мобы стоят справа от героя и смотрят на него), в полный рост, по центру кадра.
- Пиксель-арт, тёмное фэнтези, холодная десатурированная палитра — как и весь остальной арт проекта
  (`docs/prompts/_style-guide.md`), но зона мирная и приземлённая (двор лагеря, не поле боя) — без магического
  свечения/некротического фиолетового, только приглушённые деревянные/земляные тона.
- Прозрачный фон, без земли/тени/текста.
- **Заглушка = одиночный кадр.** Полные листы (`idle/attack/hit/death` по `docs/art-spec.md`) — позже тем же
  описанием.
- Путь спрайтов: `public/sprites/mobs/<id>/base.webp` (генерить PNG с альфой, класть lossless WebP). Размеры
  относительные (рядовой ≈ кадр героя, босс/пленник крупнее); точные px не важны — отмасштабируем.

---

## Соломенное чучело `straw_dummy` (common)

> Учебная мишень на деревянной палке — не бьёт, стоит смирно, пока по нему упражняются новички.

**Заменяемый файл:** `public/sprites/mobs/straw_dummy/base.webp`
**Референсы:** `public/sprites/mobs/bone_stub/base.webp` (масштаб/подача рядового моба, альфа),
`public/sprites/mobs/skeleton/base.webp` (толщина контура, пиксель-плотность)

Сгенерирован (256×332):
```
Using the attached image as the exact style reference — same hand-crafted pixel art
technique, same pixel density and outline weight, same cold desaturated dark-fantasy
palette, same side-view framing and same overall sprite height — generate a NEW enemy
sprite: a straw training dummy.

A crude practice target: a stuffed straw effigy with a lumpy sackcloth head and a bulky
torso, bound with frayed rope, mounted on a single weathered wooden post driven into the
ground. Patched burlap, loose straw poking through torn seams, old scuff marks and cut
gouges from practice weapons, one crooked wooden crossbar for arms. No face, no weapon,
no reaching limbs — it is a still, inanimate practice post, slightly pathetic.
Muted earthy colors: worn brown wood, dull straw-yellow, dusty grey burlap. Cold
desaturated dark-fantasy tone overall, but absolutely no magical glow, no purple, no
glowing eyes.

Side view, facing LEFT, full figure including the post base, standing upright, centered in
frame. Roughly human height, slightly squat and wider than a person.
Fully transparent background — output a PNG with an alpha channel. No ground, no shadow
under it, no background scenery, no text, no border, no frame.
```

## Скованный мертвец `bound_corpse` (common, «босс» — финальный бой зоны)

> Пленная нежить, которую камп держит на цепи как живую учебную цель — уже слабо огрызается.

**Заменяемый файл:** `public/sprites/mobs/bound_corpse/base.webp`
**Референсы:** `public/sprites/mobs/ghoul/base.webp` (пропорции нежити, сгорбленность, палитра),
`public/sprites/mobs/skeleton/base.webp` (толщина контура, пиксель-плотность)

Сгенерирован (256×341):
```
Using the attached image as the exact style reference — same hand-crafted pixel art
technique, same pixel density and outline weight, same cold desaturated dark-fantasy
palette, same side-view framing and comparable sprite height — generate a NEW enemy
sprite: a shackled undead captive.

A gaunt raised corpse kept chained in a mercenary camp yard as a live training target.
Ragged filthy clothes hanging off a starved frame, exposed ribs, sunken grey-green skin,
wrists and ankles locked in heavy rusted iron shackles, thick chains running back and down
to a short stout wooden stake behind it. Hunched low, head drooping, one chained arm weakly
raised as if trying to claw forward — the chain visibly holding it back. Faint dim purple
light in the empty eye sockets, much weaker than a proper undead warrior: this one is
starved, exhausted and slightly pathetic rather than menacing. No armor, no weapon, no
bright glow, no aura effects.

Side view, facing LEFT, full body including the anchor stake and chains, standing but
stooped, centered in frame. Human height, gaunt.
Fully transparent background — output a PNG with an alpha channel. No ground, no shadow
under it, no background scenery, no text, no border, no frame.
```
