-- ============================================================
--  DATOS REALES — Menú Tren Maya · Chichén Itzá + corridas
--  (Precios "conforme a autorización" — ajústalos cuando confirmen)
-- ============================================================

-- ---------- MENÚ ----------
insert into public.menu_items (servicio,grupo,nombre,descripcion,precio,principal,incluido,vegano,alcohol,orden) values
-- MAÑANA
('manana','Desayuno','Chilaquiles','Acompañados con frijoles refritos y proteína (pollo).',190,true,false,false,false,1),
('manana','Desayuno','Vaporcito','Con salsa de tomate.',160,true,false,true,false,2),
('manana','Desayuno','Omelette','De jamón y queso, acompañado con frijoles.',155,true,false,false,false,3),
('manana','Acompañamientos','Fruta','',0,false,true,false,false,4),
('manana','Acompañamientos','Café o jugo','',0,false,true,false,false,5),
('manana','Acompañamientos','Variedad de pan dulce','',0,false,true,false,false,6),
('manana','Bebidas','Café Latte','',75,false,false,false,false,7),
('manana','Bebidas','Café Frío','',110,false,false,false,false,8),
('manana','Bebidas','Capuchino','',75,false,false,false,false,9),
('manana','Bebidas','Jugo de Naranja','',65,false,false,false,false,10),
('manana','Bebidas','Leche con Chocolate','',55,false,false,false,false,11),
('manana','Menú Infantil','Hotcakes de Temayin con fruta','',125,false,false,false,false,12),
('manana','Menú Vegano','Hotcakes de avena','',120,false,false,true,false,13),
('manana','Menú Vegano','Avena con fruta','',145,false,false,true,false,14),
-- TARDE
('tarde','Comida','Baguette','4 tipos a elegir: Española, Italiana, Tradicional o Premium.',230,true,false,false,false,1),
('tarde','Comida','Antojitos Mexicanos','Sopes, pambazos, tostadas y tacos dorados.',145,true,false,false,false,2),
('tarde','Comida','Ensaladas','Opción vegana.',145,true,false,true,false,3),
('tarde','Botanas','Tabla de charcutería y quesos','',199,false,false,false,false,4),
('tarde','Botanas','Nachos con frijoles y chorizo de Valladolid','',175,false,false,false,false,5),
('tarde','Botanas','Guacamole con chorizo de Valladolid y totopos','',150,false,false,false,false,6),
('tarde','Postres','Churros','',95,false,false,false,false,7),
('tarde','Postres','Gelatina','',45,false,false,false,false,8),
('tarde','Postres','Flan','',95,false,false,false,false,9),
('tarde','Postres','Galleta con helado','',110,false,false,false,false,10),
('tarde','Postres','Brownie con helado','',110,false,false,false,false,11),
('tarde','Bebidas','Agua de chaya','',65,false,false,false,false,12),
('tarde','Bebidas','Refresco','',45,false,false,false,false,13),
('tarde','Bebidas','Cerveza Tren Maya','',89,false,false,false,true,14),
('tarde','Bebidas','Vinos','',110,false,false,false,true,15),
('tarde','Bebidas','Licores','',110,false,false,false,true,16);

-- ---------- CORRIDAS (13, 20, 27 de septiembre — ida y regreso) ----------
insert into public.corridas (fecha,sentido,servicio,hora_salida,cierre_venta,cupo,estatus) values
('2026-09-13','Teya → Chichén','manana','08:00','2026-09-11 20:00-06',38,'abierta'),
('2026-09-13','Chichén → Teya','tarde','17:00','2026-09-11 20:00-06',38,'abierta'),
('2026-09-20','Teya → Chichén','manana','08:00','2026-09-18 20:00-06',38,'abierta'),
('2026-09-20','Chichén → Teya','tarde','17:00','2026-09-18 20:00-06',38,'abierta'),
('2026-09-27','Teya → Chichén','manana','08:00','2026-09-25 20:00-06',null,'abierta'),
('2026-09-27','Chichén → Teya','tarde','17:00','2026-09-25 20:00-06',38,'abierta');
