-- max-alpha.lua
-- Приводит альфу всех пикселей активного спрайта к максимуму (255).
-- Работает по всем слоям и всем кадрам. Оборачивается в одну транзакцию (Ctrl+Z откатывает целиком).
--
-- Установка: File → Scripts → Open Scripts Folder, скопировать туда файл,
-- затем File → Scripts → Rescan Scripts Folder. Запуск: File → Scripts → max-alpha.

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

-- Пропускать полностью прозрачные пиксели (alpha == 0)?
-- true  — они останутся прозрачными (меняем только полупрозрачные).
-- false — вообще все пиксели станут непрозрачными.
local SKIP_FULLY_TRANSPARENT = true

local pc = app.pixelColor
local changed = 0

app.transaction("Max alpha", function()
  for _, cel in ipairs(sprite.cels) do
    local img = cel.image
    if img then
      local dirty = false
      for it in img:pixels() do
        local v = it()
        local a
        if mode == ColorMode.RGB then
          a = pc.rgbaA(v)
        else -- ColorMode.GRAY
          a = pc.grayaA(v)
        end

        if a ~= 255 and not (SKIP_FULLY_TRANSPARENT and a == 0) then
          local nv
          if mode == ColorMode.RGB then
            nv = pc.rgba(pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v), 255)
          else
            nv = pc.graya(pc.grayaV(v), 255)
          end
          it(nv)
          dirty = true
          changed = changed + 1
        end
      end
      if dirty then cel.image = img end
    end
  end
end)

app.refresh()
app.alert(string.format("Готово. Изменено пикселей: %d", changed))
