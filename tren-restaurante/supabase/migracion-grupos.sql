-- ============================================================
--  Migración: grupos, alergias y facturación (segura, aditiva)
--  Ejecutar en el SQL Editor de Supabase. No borra nada.
-- ============================================================
alter table public.orders add column if not exists pasajeros   jsonb;   -- [{asiento, vagon}] por pasajero
alter table public.orders add column if not exists alergias    text;    -- alergias/restricciones
alter table public.orders add column if not exists facturacion jsonb;   -- datos fiscales (rfc, razon, cp, regimen, usocfdi, correo)
