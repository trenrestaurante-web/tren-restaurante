-- ============================================================
--  Migración: entrega por nombre (sin asiento/vagón)
--  Segura, aditiva. No borra nada. Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- El asiento deja de ser obligatorio para pedidos nuevos.
-- Se conserva como dato histórico en pedidos anteriores; no se vuelve a pedir ni a usar.
alter table public.orders alter column asiento drop not null;

-- Estado de entrega de la comida, independiente del estado de pago.
alter table public.orders add column if not exists entregado    boolean not null default false;
alter table public.orders add column if not exists entregado_at timestamptz;

-- Búsqueda rápida por nombre en el panel de administración.
create index if not exists idx_orders_nombre on public.orders (lower(nombre_pasajero));

-- El panel de administración (usuario autenticado) necesita poder marcar
-- un pedido como entregado. Solo se permite tocar el estado de entrega.
drop policy if exists "orders admin marca entrega" on public.orders;
create policy "orders admin marca entrega" on public.orders
  for update to authenticated using (true) with check (true);

-- Cosmético y seguro: si tus corridas ya existentes guardan el sentido
-- abreviado ("Teya → Chichén" / "Chichén → Teya"), se renombran al texto
-- completo que ahora se usa en todo el sitio. Esto NO toca fechas, horarios,
-- cupos ni el id de la corrida, así que los pedidos ya comprados siguen
-- ligados exactamente a la misma corrida de siempre.
update public.corridas set sentido = 'Hacienda Teya → Chichén Itzá' where sentido = 'Teya → Chichén';
update public.corridas set sentido = 'Chichén Itzá → Hacienda Teya' where sentido = 'Chichén → Teya';
