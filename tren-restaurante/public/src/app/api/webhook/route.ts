import { NextResponse } from 'next/server';
import { supabaseServidor } from '@/lib/supabase';
import { enviarTicketCliente } from '@/lib/emails';

// Webhook de Stripe. Aquí es donde una orden se vuelve REAL:
// Stripe avisa "ya pagó" -> marcamos la orden como pagada -> mandamos el ticket.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return NextResponse.json({ ok: false, error: 'Stripe no configurado' }, { status: 400 });

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(key);
  const sig = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e: any) {
    return NextResponse.json({ error: `Firma inválida: ${e.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const folio = session.metadata?.folio;
    const sb = supabaseServidor();

    if (sb && folio) {
      // marcar pagada
      await sb.from('orders').update({ estatus_pago: 'pagado', stripe_session: session.id }).eq('folio', folio);

      // recuperar datos para el ticket
      const { data: ord } = await sb.from('orders')
        .select('*, corridas(sentido, fecha, hora_salida)').eq('folio', folio).single();
      const { data: items } = await sb.from('order_items').select('*').eq('order_id', ord?.id);

      if (ord) {
        const c = ord.corridas;
        const d = new Date(c.fecha + 'T12:00');
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        await enviarTicketCliente({
          folio, nombre: ord.nombre_pasajero, asiento: ord.asiento, email: ord.email,
          corrida: `${d.getDate()} ${meses[d.getMonth()].toUpperCase()} · ${c.sentido} · ${c.hora_salida?.slice(0,5)}`,
          total: Number(ord.total),
          items: (items || []).map((i: any) => ({ nombre: i.nombre, grupo: i.grupo, cantidad: i.cantidad, incluido: i.incluido })),
        });
      }
    }
  }
  return NextResponse.json({ received: true });
}
