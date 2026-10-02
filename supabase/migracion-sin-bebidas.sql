-- ============================================================
--  Migración: quitar bebidas del menú de preventa
--  Las bebidas (cafés, jugos, refrescos, alcohol) ya no se venden por
--  adelantado: se piden y se pagan directo a bordo del tren.
--  Segura, aditiva. No borra nada — solo desactiva (activo = false),
--  así que pedidos ya hechos con estas bebidas conservan su historial
--  intacto y la cocina los sigue viendo en sus reportes anteriores.
--  Ejecutar en el SQL Editor de Supabase.
-- ============================================================

update public.menu_items set activo = false where grupo = 'Bebidas';
update public.menu_items set activo = false where nombre = 'Café o jugo';
