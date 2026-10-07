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
    // El checkout guarda el folio bajo "folioGrupo" (y la lista de folios de
    // cada tramo, separados por coma, bajo "folios") — NO bajo "folio".
    const folioGrupo = session.metadata?.folioGrupo;
    const foliosList: string[] = (session.metadata?.folios || '')
      .split(',').map((f: string) => f.trim()).filter(Boolean);
    const sb = supabaseServidor();

    if (sb && (folioGrupo || foliosList.length)) {
      // marcar pagadas TODAS las órdenes de este cobro (una sola en viaje
      // sencillo, dos — ida y vuelta — en viaje redondo)
      const filtro = foliosList.length
        ? `folio.in.(${foliosList.join(',')})`
        : `folio.eq.${folioGrupo},folio_grupo.eq.${folioGrupo}`;
      await sb.from('orders')
        .update({ estatus_pago: 'pagado', stripe_session: session.id })
        .or(filtro);

      // recuperar todas las órdenes de este cobro para el ticket
      const { data: ords } = await sb.from('orders')
        .select('*, corridas(sentido, fecha, hora_salida)')
        .or(filtro)
        .order('created_at', { ascending: true });

      if (ords && ords.length) {
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const primero = ords[0];
        const esRedondo = ords.length > 1;
        const total = ords.reduce((s, o) => s + Number(o.total || 0), 0);

        const itemsPorOrden = await Promise.all(ords.map(async (ord: any) => {
          const { data: items } = await sb.from('order_items').select('*').eq('order_id', ord.id);
          const c = ord.corridas;
          const d = new Date(c.fecha + 'T12:00');
          const corridaCorta = `${d.getDate()} ${meses[d.getMonth()].toUpperCase()} · ${c.sentido} · ${c.hora_salida?.slice(0,5)}`;
          return (items || []).map((i: any) => ({
            nombre: i.nombre, grupo: esRedondo ? `${c.sentido.split(' → ')[0]} · ${i.grupo}` : i.grupo,
            cantidad: i.cantidad, incluido: i.incluido, _corridaCorta: corridaCorta,
          }));
        }));

        const corridaTxt = esRedondo
          ? [...new Set(itemsPorOrden.flat().map((i: any) => i._corridaCorta))].join(' + ')
          : itemsPorOrden[0]?.[0]?._corridaCorta || '';

        await enviarTicketCliente({
          folio: folioGrupo || primero.folio,
          nombre: primero.nombre_pasajero,
          email: primero.email,
          corrida: corridaTxt,
          total,
          items: itemsPorOrden.flat().map(({ _corridaCorta, ...resto }: any) => resto),
        });
      }
    }
  }
  return NextResponse.json({ received: true });
}