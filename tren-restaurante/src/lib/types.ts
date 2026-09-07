export type Servicio = 'manana' | 'tarde';

export interface Corrida {
  id: string;
  fecha: string;
  sentido: string;
  servicio: Servicio;
  hora_salida: string | null;
  cierre_venta: string;
  cupo: number | null;
  estatus: 'abierta' | 'cerrada';
  vendidos?: number;
}

export interface MenuItem {
  id: string;
  servicio: Servicio;
  grupo: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  principal: boolean;
  incluido: boolean;
  vegano: boolean;
  alcohol: boolean;
  activo: boolean;
  orden: number;
}

export interface CartLine { menu_item_id: string; cantidad: number; }

export interface DatosPasajero {
  nombre: string; asiento: string; telefono?: string; email?: string;
}

export function corridaAbierta(c: Corrida): boolean {
  if (c.estatus === 'cerrada') return false;
  if (c.cupo != null && (c.vendidos ?? 0) >= c.cupo) return false;
  return new Date(c.cierre_venta).getTime() > Date.now();
}

export const GRUPOS: Record<Servicio, { nombre: string; hint: string }[]> = {
  manana: [
    { nombre: 'Desayuno', hint: 'Elige tu plato principal — solo uno, en la cantidad que quieras' },
    { nombre: 'Acompañamientos', hint: 'Elige tu acompañamiento incluido (sin costo)' },
    { nombre: 'Bebidas', hint: '' },
    { nombre: 'Menú Infantil', hint: '' },
    { nombre: 'Menú Vegano', hint: '' },
  ],
  tarde: [
    { nombre: 'Comida', hint: 'Elige tu plato principal — solo uno, en la cantidad que quieras' },
    { nombre: 'Botanas', hint: '' },
    { nombre: 'Postres', hint: '' },
    { nombre: 'Bebidas', hint: 'La venta de bebidas alcohólicas está sujeta a verificación de edad a bordo.' },
  ],
};
