-- ============================================================
--  Imágenes del menú (v2) — solo fotos confirmadas.
--  Los productos sin foto quedan en NULL (muestran placeholder).
-- ============================================================
alter table public.menu_items add column if not exists imagen text;

-- Limpiar imágenes previas
update public.menu_items set imagen = null;

-- Asignar solo las confirmadas
update public.menu_items set imagen='/menu/chilaquiles.webp'      where nombre='Chilaquiles';
update public.menu_items set imagen='/menu/omelette.webp'         where nombre='Omelette';
update public.menu_items set imagen='/menu/leche-chocolate.webp'  where nombre='Leche con Chocolate';
update public.menu_items set imagen='/menu/hotcakes-temayin.webp' where nombre='Hotcakes de Temayin con fruta';
update public.menu_items set imagen='/menu/baguette.webp'         where nombre='Baguette';
update public.menu_items set imagen='/menu/antojitos.webp'        where nombre='Antojitos Mexicanos';
update public.menu_items set imagen='/menu/ensaladas.webp'        where nombre='Ensaladas';
update public.menu_items set imagen='/menu/charcuteria.webp'      where nombre='Tabla de charcutería y quesos';
update public.menu_items set imagen='/menu/nachos.webp'           where nombre='Nachos con frijoles y chorizo de Valladolid';
update public.menu_items set imagen='/menu/cerveza.webp'          where nombre='Cerveza Tren Maya';
update public.menu_items set imagen='/menu/flan.webp'             where nombre='Flan';
update public.menu_items set imagen='/menu/brownie.webp'          where nombre='Brownie con helado';
