-- ============================================================
--  Migración: grupos, alergias y facturación (segura, aditiva)
--  Ejecutar en el SQL Editor de Supabase. No borra nada.
-- ============================================================
alter table public.orders add column if not exists pasajeros   jsonb;   -- histórico: [{asiento, vagon}] por pasajero en pedidos antiguos. Ya no se escribe para pedidos nuevos (la entrega se gestiona por nombre + folio); se conserva solo como dato histórico y no se usa para validar ni bloquear nada.
alter table public.orders add column if not exists alergias    text;    -- alergias/restricciones
alter table public.orders add column if not exists facturacion jsonb;   -- datos fiscales (rfc, razon, cp, regimen, usocfdi, correo)
