import Link from 'next/link';
import { supabaseServidor } from '@/lib/supabase';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export const dynamic = 'force-dynamic';

export default async function Confirmacion({ searchParams }: { searchParams: Promise<{ folio?: string }> }) {
  const { folio } = await searchParams;
  const sb = supabaseServidor();
  let ord: any = null, items: any[] = [];
  if (sb && folio) {
    const r = await sb.from('orders').select('*, corridas(sentido, fecha, hora_salida)').eq('folio', folio).single();
    ord = r.data;
    if (ord) { const ri = await sb.from('order_items').select('*').eq('order_id', ord.id); items = ri.data || []; }
  }

  if (!ord) {
    return (
      <>
        <div className="franja" /><span className="greca" />
        <div className="wrap seccion" style={{ textAlign: 'center', paddingTop: 80 }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 28 }}>No encontramos ese comprobante</h2>
          <p style={{ color: 'rgba(244,238,223,.7)', marginTop: 10 }}>Revisa el enlace de tu correo.</p>
          <Link href="/" className="btn btn-fantasma" style={{ marginTop: 24 }}>Volver al inicio</Link>
        </div>
      </>
    );
  }

  const c = ord.corridas;
  const d = new Date(c.fecha + 'T12:00');
  const corridaCorta = `${d.getDate()} ${MESES[d.getMonth()].toUpperCase()} · ${c.hora_salida?.slice(0,5)}`;

  return (
    <>
      <div className="franja" /><span className="greca" />
      <div className="wrap seccion">
        <div className="conf">
          <div className="check">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F3EEE3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h2>Compra confirmada</h2>
          <p className="sub">Presenta este pase (o indica tu asiento y nombre) al personal a bordo.</p>
          <div className="pase">
            <div className="pase-head"><div className="pase-head-row"><span className="tit">Comprobante de compra</span><span className="logo">Tren Restaurante</span></div></div>
            <span className="greca sm" />
            <div className="pase-body">
              <div className="pase-folio"><div className="l">Folio</div><div className="c">{ord.folio}</div></div>
              <div className="pase-grid">
                <div className="campo-p"><div className="l">Pasajero</div><div className="v">{ord.nombre_pasajero}</div></div>
                <div className="campo-p"><div className="l">Asiento</div><div className="v mono">{ord.asiento}</div></div>
                <div className="campo-p"><div className="l">Corrida</div><div className="v mono" style={{ fontSize: 15 }}>{corridaCorta}</div></div>
                <div className="campo-p"><div className="l">Sentido</div><div className="v" style={{ fontSize: 15 }}>{c.sentido}</div></div>
              </div>
              <div className="pase-perf" />
              <div className="pase-items">
                {items.map((it, i) => (
                  <div className="pi" key={i}><span className="n"><b>{it.grupo}</b>{it.nombre}</span><span className="q">{it.incluido ? 'Incluido' : '×' + it.cantidad}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div className="conf-acciones"><Link href="/" className="btn btn-fantasma">Volver al inicio</Link></div>
        </div>
      </div>
    </>
  );
}
