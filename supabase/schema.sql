-- ============================================================
--  TREN RESTAURANTE — Schema Supabase (modelo real)
--  Ejecutar completo en el SQL Editor de Supabase.
-- ============================================================

-- 1. CORRIDAS
create table if not exists public.corridas (
  id            uuid primary key default gen_random_uuid(),
  fecha         date        not null,
  sentido       text        not null,               -- 'Teya → Chichén' | 'Chichén → Teya'
  servicio      text        not null,               -- 'manana' | 'tarde'
  hora_salida   time,
  cierre_venta  timestamptz not null,               -- después de esto ya no se vende
  cupo          integer,                             -- NULL = sin tope
  estatus       text        not null default 'abierta',
  created_at    timestamptz not null default now()
);

-- 2. MENU_ITEMS  (menú fijo)
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  servicio     text        not null,                -- 'manana' | 'tarde'
  grupo        text        not null,                -- 'Desayuno','Acompañamientos','Bebidas',...
  nombre       text        not null,
  descripcion  text,
  precio       numeric(10,2) not null default 0,
  principal    boolean     not null default false,  -- plato principal (uno por orden)
  incluido     boolean     not null default false,  -- selección única sin costo
  vegano       boolean     not null default false,
  alcohol      boolean     not null default false,
  activo       boolean     not null default true,
  orden        integer     not null default 0
);

-- 3. ORDERS
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  corrida_id        uuid not null references public.corridas(id),
  folio             text not null unique,
  nombre_pasajero   text not null,
  asiento           text not null,
  telefono          text,
  email             text,
  total             numeric(10,2) not null,
  estatus_pago      text not null default 'pendiente',   -- 'pendiente' | 'pagado'
  stripe_session    text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_orders_corrida on public.orders(corrida_id);

-- 4. ORDER_ITEMS  (con snapshot para que el panel no dependa del menú vivo)
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  menu_item_id    uuid,
  nombre          text not null,       -- snapshot
  grupo           text not null,       -- snapshot
  incluido        boolean not null default false,
  cantidad        integer not null default 1,
  precio_unitario numeric(10,2) not null default 0,
  subtotal        numeric(10,2) not null default 0
);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ============================================================
--  RLS
-- ============================================================
alter table public.corridas    enable row level security;
alter table public.menu_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "corridas lectura publica" on public.corridas;
create policy "corridas lectura publica" on public.corridas
  for select to anon, authenticated using (true);

drop policy if exists "menu lectura publica" on public.menu_items;
create policy "menu lectura publica" on public.menu_items
  for select to anon, authenticated using (activo = true);

-- Orders / items: solo lectura para admin autenticado.
-- La escritura la hace el servidor con la service_role key (se salta RLS).
drop policy if exists "orders lectura admin" on public.orders;
create policy "orders lectura admin" on public.orders
  for select to authenticated using (true);

drop policy if exists "order_items lectura admin" on public.order_items;
create policy "order_items lectura admin" on public.order_items
  for select to authenticated using (true);
