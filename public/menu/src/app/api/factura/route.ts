import { NextResponse } from 'next/server';
import { supabaseServidor } from '@/lib/supabase';

// Guarda los datos fiscales del cliente en la orden (por folio).
// NO emite factura — solo recopila para que el personal facture después.
export async function POST(req: Request) {
  try {
    const { folio, factura } = await req.json();
    if (!folio || !factura?.rfc) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });

    const sb = supabaseServidor();
    if (sb) {
      await sb.from('orders').update({ facturacion: factura }).eq('folio', folio);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno.' }, { status: 500 });
  }
}
