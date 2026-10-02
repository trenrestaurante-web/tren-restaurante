-- ============================================================
--  DATOS REALES — Menú Tren Maya · Chichén Itzá + corridas
--  (Precios "conforme a autorización" — ajústalos cuando confirmen)
-- ============================================================

-- ---------- MENÚ ----------
-- Las bebidas (cafés, jugos, refrescos, alcohol) no se preventan: se piden
-- y se pagan directo a bordo del tren, por eso no hay filas "Bebidas" aquí.
insert into public.menu_items (servicio,grupo,nombre,descripcion,precio,principal,incluido,vegano,alcohol,orden) values
-- MAÑANA
('manana','Desayuno','Chilaquiles','Acompañados con frijoles refritos y proteína (pollo).',190,true,false,false,false,1),
('manana','Desayuno','Vaporcito','Con salsa de tomate.',160,true,false,true,false,2),
('manana','Desayuno','Omelette','De jamón y queso, acompañado con frijoles.',155,true,false,false,false,3),
('manana','Acompañamientos','Fruta','',0,false,true,false,false,4),
('manana','Acompañamientos','Variedad de pan dulce','',0,false,true,false,false,5),
('manana','Menú Infantil','Hotcakes de Temayin con fruta','',125,false,false,false,false,6),
('manana','Menú Vegano','Hotcakes de avena','',120,false,false,true,false,7),
('manana','Menú Vegano','Avena con fruta','',145,false,false,true,false,8),
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
('tarde','Postres','Brownie con helado','',110,false,false,false,false,11);

-- ---------- CORRIDAS (13, 20, 27 de septiembre — ida y regreso) ----------
-- Nota: estas fechas de septiembre ya pasaron; se dejan solo como ejemplo
-- para una instalación nueva. Las corridas reales vigentes (octubre 2026
-- en adelante) se cargan con datos operativos confirmados — ver
-- supabase/corridas-octubre-PLANTILLA.sql.
insert into public.corridas (fecha,sentido,servicio,hora_salida,cierre_venta,cupo,estatus) values
('2026-09-13','Hacienda Teya → Chichén Itzá','manana','08:00','2026-09-11 20:00-06',38,'abierta'),
('2026-09-13','Chichén Itzá → Hacienda Teya','tarde','17:00','2026-09-11 20:00-06',38,'abierta'),
('2026-09-20','Hacienda Teya → Chichén Itzá','manana','08:00','2026-09-18 20:00-06',38,'abierta'),
('2026-09-20','Chichén Itzá → Hacienda Teya','tarde','17:00','2026-09-18 20:00-06',38,'abierta'),
('2026-09-27','Hacienda Teya → Chichén Itzá','manana','08:00','2026-09-25 20:00-06',null,'abierta'),
('2026-09-27','Chichén Itzá → Hacienda Teya','tarde','17:00','2026-09-25 20:00-06',38,'abierta');
