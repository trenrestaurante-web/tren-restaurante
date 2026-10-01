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
  imagen?: string | null;
}

export interface CartLine { menu_item_id: string; cantidad: number; }

export interface DatosEntrega {
  nombre: string; telefono?: string; email?: string;
}

export interface Order {
  id: string;
  corrida_id: string;
  folio: string;
  folio_grupo?: string | null;
  nombre_pasajero: string;
  asiento?: string | null;     // histórico; pedidos nuevos ya no lo usan
  telefono?: string | null;
  email?: string | null;
  total: number;
  estatus_pago: 'pendiente' | 'pagado';
  entregado: boolean;
  entregado_at?: string | null;
  viaje_redondo?: boolean;
  alergias?: string | null;
  facturacion?: any;
  created_at?: string;
}

export function corridaAbierta(c: Corrida): boolean {
  if (c.estatus === 'cerrada') return false;
  if (c.cupo != null && (c.vendidos ?? 0) >= c.cupo) return false;
  return new Date(c.cierre_venta).getTime() > Date.now();
}

export const GRUPOS: Record<Servicio, { nombre: string; hint: string }[]> = {
  manana: [
    { nombre: 'Desayuno', hint: 'Elige tu plato principal — solo uno, en la cantidad que quieras' },
    { nombre: 'Acompañamientos', hint: '' },
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
