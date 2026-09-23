-- Migración: viaje redondo (ida y vuelta como 2 órdenes ligadas)
-- Segura, aditiva, no borra nada.
alter table public.orders add column if not exists viaje_redondo boolean default false;
alter table public.orders add column if not exists folio_grupo   text; -- folio común que une ida+vuelta
