import { supabasePublico } from './supabase';
import type { Corrida, MenuItem } from './types';

// ============================================================
//  Datos de respaldo (fallback) — para que la web se vea aunque
//  Supabase todavía no esté conectado. Espejo del seed.sql.
// ============================================================
export const MENU_FALLBACK: MenuItem[] = [
  m('manana','Desayuno','Chilaquiles','Acompañados con frijoles refritos y proteína (pollo).',190,{principal:true,imagen:'/menu/chilaquiles.webp'}),
  m('manana','Desayuno','Vaporcito','Con salsa de tomate.',160,{principal:true,vegano:true}),
  m('manana','Desayuno','Omelette','De jamón y queso, acompañado con frijoles.',155,{principal:true,imagen:'/menu/omelette.webp'}),
  m('manana','Acompañamientos','Fruta','',0,{incluido:true}),
  m('manana','Acompañamientos','Café o jugo','',0,{incluido:true}),
  m('manana','Acompañamientos','Variedad de pan dulce','',0,{incluido:true}),
  m('manana','Bebidas','Café Latte','',75),
  m('manana','Bebidas','Café Frío','',110),
  m('manana','Bebidas','Capuchino','',75),
  m('manana','Bebidas','Jugo de Naranja','',65),
  m('manana','Bebidas','Leche con Chocolate','',55,{imagen:'/menu/leche-chocolate.webp'}),
  m('manana','Menú Infantil','Hotcakes de Temayin con fruta','',125,{imagen:'/menu/hotcakes-temayin.webp'}),
  m('manana','Menú Vegano','Hotcakes de avena','',120,{vegano:true}),
  m('manana','Menú Vegano','Avena con fruta','',145,{vegano:true}),
  m('tarde','Comida','Baguette','4 tipos a elegir: Española, Italiana, Tradicional o Premium.',230,{principal:true,imagen:'/menu/baguette.webp'}),
  m('tarde','Comida','Antojitos Mexicanos','Sopes, pambazos, tostadas y tacos dorados.',145,{principal:true,imagen:'/menu/antojitos.webp'}),
  m('tarde','Comida','Ensaladas','Opción vegana.',145,{principal:true,vegano:true,imagen:'/menu/ensaladas.webp'}),
  m('tarde','Botanas','Tabla de charcutería y quesos','',199,{imagen:'/menu/charcuteria.webp'}),
  m('tarde','Botanas','Nachos con frijoles y chorizo de Valladolid','',175,{imagen:'/menu/nachos.webp'}),
  m('tarde','Botanas','Guacamole con chorizo de Valladolid y totopos','',150),
  m('tarde','Postres','Churros','',95),
  m('tarde','Postres','Gelatina','',45),
  m('tarde','Postres','Flan','',95,{imagen:'/menu/flan.webp'}),
  m('tarde','Postres','Galleta con helado','',110),
  m('tarde','Postres','Brownie con helado','',110,{imagen:'/menu/brownie.webp'}),
  m('tarde','Bebidas','Agua de chaya','',65),
  m('tarde','Bebidas','Refresco','',45),
  m('tarde','Bebidas','Cerveza Tren Maya','',89,{alcohol:true,imagen:'/menu/cerveza.webp'}),
  m('tarde','Bebidas','Vinos','',110,{alcohol:true}),
  m('tarde','Bebidas','Licores','',110,{alcohol:true}),
];

export const CORRIDAS_FALLBACK: Corrida[] = [
  c('2026-09-13','Teya → Chichén','manana','08:00','2026-09-11T20:00:00-06:00',38,11),
  c('2026-09-13','Chichén → Teya','tarde','17:00','2026-09-11T20:00:00-06:00',38,9),
  c('2026-09-20','Teya → Chichén','manana','08:00','2026-09-18T20:00:00-06:00',38,4),
  c('2026-09-20','Chichén → Teya','tarde','17:00','2026-09-18T20:00:00-06:00',38,2),
  c('2026-09-27','Teya → Chichén','manana','08:00','2026-09-25T20:00:00-06:00',null,0),
  c('2026-09-27','Chichén → Teya','tarde','17:00','2026-09-25T20:00:00-06:00',38,38),
];

// ============================================================
//  Lectura desde Supabase (con fallback si no hay datos/conexión)
// ============================================================
export async function getCorridas(): Promise<Corrida[]> {
  const sb = supabasePublico();
  if (!sb) return CORRIDAS_FALLBACK;
  const { data } = await sb.from('corridas').select('*').order('fecha').order('hora_salida');
  if (!data || data.length === 0) return CORRIDAS_FALLBACK;
  return data as Corrida[];
}

export async function getMenu(): Promise<MenuItem[]> {
  const sb = supabasePublico();
  if (!sb) return MENU_FALLBACK;
  const { data } = await sb.from('menu_items').select('*').eq('activo', true).order('orden');
  if (!data || data.length === 0) return MENU_FALLBACK;
  return data as MenuItem[];
}

// ============================================================
//  Folio: TR-XXXX (sin caracteres confusos)
// ============================================================
export function generarFolio(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'TR-' + s;
}

// ---------- helpers internos ----------
function m(servicio: any, grupo: string, nombre: string, descripcion: string, precio: number,
  extra: Partial<MenuItem> = {}): MenuItem {
  return {
    id: `${grupo}-${nombre}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    servicio, grupo, nombre, descripcion: descripcion || null, precio,
    principal: false, incluido: false, vegano: false, alcohol: false,
    activo: true, orden: 0, ...extra,
  };
}
function c(fecha: string, sentido: string, servicio: any, hora: string,
  cierre: string, cupo: number | null, vendidos: number): Corrida {
  return {
    id: `${fecha}-${servicio}`, fecha, sentido, servicio,
    hora_salida: hora, cierre_venta: cierre, cupo, estatus: 'abierta', vendidos,
  };
}
