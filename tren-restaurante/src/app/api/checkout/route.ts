import { NextResponse } from 'next/server';
import { supabaseServidor } from '@/lib/supabase';
import { getCorridas, getMenu, generarFolio } from '@/lib/data';
import { enviarTicketCliente } from '@/lib/emails';
import type { Corrida, MenuItem } from '@/lib/types';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ¿Stripe está configurado? Si no, corremos en MODO DEMO.
const STRIPE_ON = Boolean(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const { corridaId, datos, lineas } = await req.json();

    if (!datos?.nombre?.trim() || !datos?.asiento?.trim())
      return NextResponse.json({ error: 'Faltan datos del pasajero.' }, { status: 400 });
    if (!Array.isArray(lineas) || lineas.length === 0)
      return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });

    const corridas = await getCorridas();
    const menu = await getMenu();
    const corrida = corridas.find((c: Corrida) => c.id === corridaId);
    if (!corrida) return NextResponse.json({ error: 'Corrida no encontrada.' }, { status: 404 });

    // Construir las líneas con precios del servidor (nunca confiar en el cliente)
    const items = lineas.map((l: any) => {
      const m = menu.find((x: MenuItem) => x.id === l.menu_item_id);
      if (!m) return null;
      const cantidad = Math.max(1, Number(l.cantidad) || 1);
      return {
        menu_item_id: m.id, nombre: m.nombre, grupo: m.grupo, incluido: m.incluido,
        cantidad, precio_unitario: m.precio, subtotal: m.precio * cantidad,
      };
    }).filter(Boolean) as any[];

    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const folio = generarFolio();
    const d = new Date(corrida.fecha + 'T12:00');
    const corridaCorta = `${d.getDate()} ${MESES[d.getMonth()].toUpperCase()} · ${corrida.hora_salida?.slice(0,5)}`;

    // ============================================================
    //  STRIPE (cuando esté configurado): crear sesión y redirigir.
    // ============================================================
    if (STRIPE_ON) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

      // Guardar la orden como 'pendiente' antes de mandar a pagar
      const sb = supabaseServidor();
      let orderId: string | null = null;
      if (sb) {
        const { data: ord } = await sb.from('orders').insert({
          corrida_id: corrida.id, folio, nombre_pasajero: datos.nombre, asiento: datos.asiento,
          telefono: datos.telefono, email: datos.email, total, estatus_pago: 'pendiente',
        }).select('id').single();
        orderId = ord?.id ?? null;
        if (orderId) await sb.from('order_items').insert(items.map(i => ({ ...i, order_id: orderId })));
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${base}/confirmacion?folio=${folio}`,
        cancel_url: `${base}/`,
        customer_email: datos.email || undefined,
        line_items: items.filter(i => i.subtotal > 0).map(i => ({
          quantity: i.cantidad,
          price_data: {
            currency: 'mxn',
            unit_amount: Math.round(i.precio_unitario * 100),
            product_data: { name: `${i.grupo} · ${i.nombre}` },
          },
        })),
        metadata: { folio, orderId: orderId || '' },
      });
      return NextResponse.json({ url: session.url });
    }

    // ============================================================
    //  MODO DEMO (sin Stripe): se marca como pagada de una vez.
    // ============================================================
    const sb = supabaseServidor();
    if (sb) {
      const { data: ord } = await sb.from('orders').insert({
        corrida_id: corrida.id, folio, nombre_pasajero: datos.nombre, asiento: datos.asiento,
        telefono: datos.telefono, email: datos.email, total, estatus_pago: 'pagado',
      }).select('id').single();
      if (ord?.id) await sb.from('order_items').insert(items.map(i => ({ ...i, order_id: ord.id })));
    }

    // ticket por correo (si Resend está configurado)
    await enviarTicketCliente({
      folio, nombre: datos.nombre, asiento: datos.asiento, email: datos.email,
      corrida: `${corridaCorta} · ${corrida.sentido}`, total, items,
    });

    return NextResponse.json({
      comprobante: {
        folio, nombre: datos.nombre, asiento: (datos.asiento || '').toUpperCase(),
        corridaCorta, sentido: corrida.sentido, items,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno.' }, { status: 500 });
  }
}
