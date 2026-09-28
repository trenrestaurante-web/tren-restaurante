import { NextResponse } from 'next/server';
import { supabaseServidor } from '@/lib/supabase';
import { getCorridas, getMenu, generarFolio } from '@/lib/data';
import { enviarTicketCliente } from '@/lib/emails';
import type { Corrida, MenuItem } from '@/lib/types';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ¿Stripe está configurado? Si no, corremos en MODO DEMO.
const STRIPE_ON = Boolean(process.env.STRIPE_SECRET_KEY);

function armarItems(lineas: any[], menu: MenuItem[]) {
  return lineas.map((l: any) => {
    const m = menu.find((x: MenuItem) => x.id === l.menu_item_id);
    if (!m) return null;
    const cantidad = Math.max(1, Number(l.cantidad) || 1);
    return {
      menu_item_id: m.id, nombre: l.nombre_override || m.nombre, grupo: m.grupo, incluido: m.incluido,
      cantidad, precio_unitario: m.precio, subtotal: m.precio * cantidad,
    };
  }).filter(Boolean) as any[];
}

export async function POST(req: Request) {
  try {
    const { corridaId, lineas, tramos, datos, pasajeros, alergias } = await req.json();

    if (!datos?.nombre?.trim() || !datos?.asiento?.trim())
      return NextResponse.json({ error: 'Faltan datos del pasajero.' }, { status: 400 });

    const corridas = await getCorridas();
    const menu = await getMenu();

    // Normaliza a una lista de "tramos" (1 si es sencillo, 2 si es ida y vuelta)
    const listaTramos: { corridaId: string; lineas: any[] }[] = Array.isArray(tramos) && tramos.length
      ? tramos
      : [{ corridaId, lineas }];

    const procesados = listaTramos.map(t => {
      const corrida = corridas.find((c: Corrida) => c.id === t.corridaId);
      if (!corrida) return null;
      const items = armarItems(t.lineas || [], menu);
      if (!items.length) return null;
      const total = items.reduce((s, i) => s + i.subtotal, 0);
      const d = new Date(corrida.fecha + 'T12:00');
      const corridaCorta = `${d.getDate()} ${MESES[d.getMonth()].toUpperCase()} · ${corrida.hora_salida?.slice(0,5)}`;
      return { corrida, items, total, corridaCorta };
    }).filter(Boolean) as { corrida: Corrida; items: any[]; total: number; corridaCorta: string }[];

    if (!procesados.length) return NextResponse.json({ error: 'El carrito está vacío o la corrida no existe.' }, { status: 400 });

    const esRedondo = procesados.length > 1;
    const folioBase = generarFolio();
    const totalGeneral = procesados.reduce((s, p) => s + p.total, 0);

    // ============================================================
    //  STRIPE (cuando esté configurado): un solo cobro, N órdenes.
    // ============================================================
    if (STRIPE_ON) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

      const sb = supabaseServidor();
      const folios: string[] = [];
      if (sb) {
        for (let i = 0; i < procesados.length; i++) {
          const p = procesados[i];
          const folio = esRedondo ? `${folioBase}-${i === 0 ? 'IDA' : 'VUELTA'}` : folioBase;
          folios.push(folio);
          const { data: ord } = await sb.from('orders').insert({
            corrida_id: p.corrida.id, folio, nombre_pasajero: datos.nombre, asiento: datos.asiento,
            telefono: datos.telefono, email: datos.email, total: p.total, estatus_pago: 'pendiente',
            pasajeros: pasajeros || null, alergias: alergias || null,
            viaje_redondo: esRedondo, folio_grupo: esRedondo ? folioBase : null,
          }).select('id').single();
          if (ord?.id) await sb.from('order_items').insert(p.items.map(it => ({ ...it, order_id: ord.id })));
        }
      }

      const line_items = procesados.flatMap(p =>
        p.items.filter(i => i.subtotal > 0).map(i => ({
          quantity: i.cantidad,
          price_data: {
            currency: 'mxn',
            unit_amount: Math.round(i.precio_unitario * 100),
            product_data: { name: `${p.corrida.sentido} · ${i.grupo} · ${i.nombre}` },
          },
        }))
      );

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${base}/confirmacion?folio=${folioBase}`,
        cancel_url: `${base}/`,
        customer_email: datos.email || undefined,
        line_items,
        metadata: { folioGrupo: folioBase, folios: folios.join(','), redondo: String(esRedondo) },
      });
      return NextResponse.json({ url: session.url });
    }

    // ============================================================
    //  MODO DEMO (sin Stripe): se marca como pagada de una vez.
    // ============================================================
    const sb = supabaseServidor();
    const comprobanteItems: any[] = [];
    for (let i = 0; i < procesados.length; i++) {
      const p = procesados[i];
      const folio = esRedondo ? `${folioBase}-${i === 0 ? 'IDA' : 'VUELTA'}` : folioBase;
      if (sb) {
        const { data: ord } = await sb.from('orders').insert({
          corrida_id: p.corrida.id, folio, nombre_pasajero: datos.nombre, asiento: datos.asiento,
          telefono: datos.telefono, email: datos.email, total: p.total, estatus_pago: 'pagado',
          pasajeros: pasajeros || null, alergias: alergias || null,
          viaje_redondo: esRedondo, folio_grupo: esRedondo ? folioBase : null,
        }).select('id').single();
        if (ord?.id) await sb.from('order_items').insert(p.items.map(it => ({ ...it, order_id: ord.id })));
      }
      comprobanteItems.push(...p.items.map(it => ({ ...it, tramo: esRedondo ? p.corrida.sentido : undefined })));
    }

    // ticket por correo (si Resend está configurado) — resumen combinado
    const corridaTxt = esRedondo
      ? procesados.map(p => `${p.corridaCorta} · ${p.corrida.sentido}`).join(' + ')
      : `${procesados[0].corridaCorta} · ${procesados[0].corrida.sentido}`;
    await enviarTicketCliente({
      folio: folioBase, nombre: datos.nombre, asiento: datos.asiento, email: datos.email,
      corrida: corridaTxt, total: totalGeneral, items: comprobanteItems,
    });

    return NextResponse.json({
      comprobante: {
        folio: folioBase, nombre: datos.nombre, asiento: (datos.asiento || '').toUpperCase(),
        corridaCorta: esRedondo ? 'Viaje redondo' : procesados[0].corridaCorta,
        sentido: esRedondo ? procesados.map(p => p.corrida.sentido).join('  +  ') : procesados[0].corrida.sentido,
        items: comprobanteItems, total: totalGeneral,
        pasajeros: pasajeros || null, alergias: alergias || null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno.' }, { status: 500 });
  }
}
