-- ============================================================
--  PLANTILLA — Corridas de octubre 2026
--  Solo dos sentidos: "Hacienda Teya → Chichén Itzá" y
--  "Chichén Itzá → Hacienda Teya".
--
--  IMPORTANTE: este archivo NO trae fechas, horarios, números de tren,
--  cupos ni días de operación inventados, ni copiados de septiembre
--  asumiendo que siguen vigentes. Son solo placeholders ⟨ENTRE ESTOS ⟩
--  que deben reemplazarse con la información operativa CONFIRMADA antes
--  de ejecutar este script.
--
--  Cómo usarlo:
--  1) Reemplaza cada ⟨placeholder⟩ con el dato real y confirmado.
--  2) Borra (o deja fuera) cualquier fila para la que todavía no haya
--     dato confirmado — es preferible publicar menos corridas y
--     correctas, que adivinar.
--  3) Duplica el bloque "insert" tantas veces como corridas haya.
--  4) Ejecuta el resultado en el SQL Editor de Supabase.
-- ============================================================

insert into public.corridas (fecha, sentido, servicio, hora_salida, cierre_venta, cupo, estatus)
values
  -- Ejemplo de una corrida de ida (Hacienda Teya → Chichén Itzá):
  (
    '⟨YYYY-MM-DD⟩',                               -- fecha de la corrida (octubre 2026)
    'Hacienda Teya → Chichén Itzá',                -- sentido (no cambiar este texto)
    '⟨manana|tarde⟩',                              -- servicio: usar 'manana' o 'tarde' según el horario real
    '⟨HH:MM⟩',                                     -- hora de salida CONFIRMADA (hora local de Yucatán)
    '⟨YYYY-MM-DDTHH:MM:SS-06:00⟩',                 -- cierre de venta (zona horaria de Yucatán, -06:00, sin horario de verano)
    ⟨cupo_o_null⟩,                                 -- cupo confirmado, o NULL si no hay tope
    'abierta'
  )
  -- , ( ... siguiente corrida ... )
;

insert into public.corridas (fecha, sentido, servicio, hora_salida, cierre_venta, cupo, estatus)
values
  -- Ejemplo de una corrida de vuelta (Chichén Itzá → Hacienda Teya):
  (
    '⟨YYYY-MM-DD⟩',
    'Chichén Itzá → Hacienda Teya',
    '⟨manana|tarde⟩',
    '⟨HH:MM⟩',
    '⟨YYYY-MM-DDTHH:MM:SS-06:00⟩',
    ⟨cupo_o_null⟩,
    'abierta'
  )
  -- , ( ... siguiente corrida ... )
;

-- Dato operativo que falta para poder publicar octubre (llenar con el
-- equipo antes de ejecutar este script):
--   · Fechas exactas de operación en octubre 2026 para cada sentido.
--   · Hora(s) de salida confirmada(s) por fecha.
--   · Número(s) de tren / frecuencia, si aplica a la operación.
--   · Cupo por corrida (o "sin tope" si no aplica).
--   · Hora de cierre de venta antes de cada corrida.
