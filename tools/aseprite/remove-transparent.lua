-- remove-transparent.lua
-- Удаляет все не полностью непрозрачные пиксели активного спрайта: пиксель с
-- альфой <= THRESHOLD полностью обнуляется (RGBA = 0,0,0,0).
-- Парная утилита к max-alpha.lua: вместе дают жёсткий 1-битный край альфы
-- (полупрозрачная кайма анти-алиасинга либо становится непрозрачной, либо исчезает).
-- Работает по всем слоям и всем кадрам. Оборачивается в одну транзакцию (Ctrl+Z откатывает целиком).
--
-- Установка: File → Scripts → Open Scripts Folder, скопировать туда файл,
-- затем File → Scripts → Rescan Scripts Folder. Запуск: File → Scripts → remove-transparent.

local sprite = app.activeSprite
if not sprite then
  app.alert("Нет открытого спрайта")
  return
end

local mode = sprite.colorMode
if mode == ColorMode.INDEXED then
  app.alert("Indexed-режим не поддерживается (у пикселей нет альфа-канала). Sprite → Color Mode → RGB.")
  return
end

-- Порог: пиксели с альфой <= THRESHOLD удаляются (становятся 0,0,0,0).
-- 254 — убрать всё, что не полностью непрозрачно (вся полупрозрачная кайма).
-- 127 — убрать только «слабые» пиксели, оставить более плотные.
local THRESHOLD = 254

local pc = app.pixelColor
local clear
if mode == ColorMode.RGB then
  clear = pc.rgba(0, 0, 0, 0)
else -- ColorMode.GRAY
  clear = pc.graya(0, 0)
end

local changed = 0

app.transaction("Remove transparent", function()
  for _, cel in ipairs(sprite.cels) do
    local img = cel.image
    if img then
      local dirty = false
      for it in img:pixels() do
        local v = it()
        local a
        if mode == ColorMode.RGB then
          a = pc.rgbaA(v)
        else
          a = pc.grayaA(v)
        end

        if a <= THRESHOLD and v ~= clear then
          it(clear)
          dirty = true
          changed = changed + 1
        end
      end
      if dirty then cel.image = img end
    end
  end
end)

app.refresh()
app.alert(string.format("Готово. Очищено пикселей: %d", changed))
