'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export default function Admin() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [corridas, setCorridas] = useState<any[]>([]);
  const [corridaId, setCorridaId] = useState<string>('');
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  // sesión
  useEffect(() => {
    (async () => {
      const { data } = await sb().auth.getSession();
      if (!data.session) { router.replace('/admin/login'); return; }
      setListo(true);
      const { data: cs } = await sb().from('corridas').select('*').order('fecha').order('hora_salida');
      setCorridas(cs || []);
      if (cs && cs.length) setCorridaId(cs[0].id);
    })();
  }, [router]);

  // cargar órdenes pagadas de la corrida seleccionada
  useEffect(() => {
    if (!corridaId) return;
    setCargando(true);
    (async () => {
      const { data } = await sb()
        .from('orders')
        .select('*, order_items(*)')
        .eq('corrida_id', corridaId)
        .eq('estatus_pago', 'pagado')
        .order('asiento');
      setOrdenes(data || []);
      setCargando(false);
    })();
  }, [corridaId]);

  const corrida = corridas.find(c => c.id === corridaId);

  // Vista 1: resumen de producción (cuánto cocinar) — agrupa por platillo
  const resumen = useMemo(() => {
    const map = new Map<string, { grupo: string; nombre: string; cantidad: number }>();
    for (const o of ordenes)
      for (const it of (o.order_items || [])) {
        const key = `${it.grupo}|${it.nombre}`;
        const prev = map.get(key);
        map.set(key, { grupo: it.grupo, nombre: it.nombre, cantidad: (prev?.cantidad || 0) + it.cantidad });
      }
    return [...map.values()].sort((a, b) => a.grupo.localeCompare(b.grupo) || a.nombre.localeCompare(b.nombre));
  }, [ordenes]);

  const totalMenus = ordenes.length;
  const totalVendido = ordenes.reduce((s, o) => s + Number(o.total), 0);

  function etiquetaCorrida(c: any) {
    if (!c) return '';
    const d = new Date(c.fecha + 'T12:00');
    return `${d.getDate()} ${MESES[d.getMonth()]} · ${c.sentido} · ${c.hora_salida?.slice(0,5)}`;
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new();
    // Hoja 1: resumen de producción
    const h1 = [['Grupo', 'Platillo', 'Cantidad'], ...resumen.map(r => [r.grupo, r.nombre, r.cantidad])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(h1), 'Producción');
    // Hoja 2: lista de entrega por asiento
    const h2: any[] = [['Asiento', 'Pasajero', 'Folio', 'Platillos']];
    for (const o of ordenes) {
      const detalle = (o.order_items || []).map((i: any) => `${i.nombre}${i.incluido ? '' : ' ×' + i.cantidad}`).join(', ');
      h2.push([o.asiento, o.nombre_pasajero, o.folio, detalle]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(h2), 'Entrega');
    const et = etiquetaCorrida(corrida).replace(/[^\w]+/g, '_');
    XLSX.writeFile(wb, `TrenRestaurante_${et}.xlsx`);
  }

  async function salir() { await sb().auth.signOut(); router.replace('/admin/login'); }

  if (!listo) return null;

  return (
    <>
      <div className="franja" /><span className="greca" />
      <div className="wrap" style={{ paddingTop: 28, paddingBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="eyebrow">Panel de cocina</span>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 30, marginTop: 8 }}>Control de pedidos</h2>
          </div>
          <button className="btn btn-fantasma" onClick={salir}>Salir</button>
        </div>

        {/* selector de corrida */}
        <div className="menu-corrida" style={{ marginBottom: 24 }}>
          <div className="mc-l" style={{ flexWrap: 'wrap' }}>
            <span className="mono" style={{ color: 'var(--oro-claro)', fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>Corrida</span>
            <select value={corridaId} onChange={e => setCorridaId(e.target.value)}
              style={{ fontFamily: 'var(--body)', fontSize: 15, padding: '10px 14px', borderRadius: 4, background: 'var(--cal)', color: 'var(--tinta)', border: 'none' }}>
              {corridas.map(c => <option key={c.id} value={c.id}>{etiquetaCorrida(c)}</option>)}
            </select>
          </div>
          <button className="mc-cambiar" onClick={exportarExcel}>Exportar a Excel</button>
        </div>

        {/* contadores */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 30, flexWrap: 'wrap' }}>
          <Contador n={totalMenus} l="Órdenes pagadas" />
          <Contador n={resumen.reduce((s, r) => s + r.cantidad, 0)} l="Platillos totales" />
          <Contador n={`$${totalVendido.toLocaleString('es-MX')}`} l="Vendido" />
        </div>

        {cargando ? <p style={{ color: 'rgba(244,238,223,.6)' }}>Cargando…</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 24 }} className="admin-grid">
            {/* Vista 1: producción */}
            <div>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 14 }}>Resumen de producción</h3>
              <div className="tabla">
                {resumen.length === 0 ? <div className="tabla-vacia">Sin pedidos pagados todavía.</div> :
                  resumen.map((r, i) => (
                    <div className="tabla-fila" key={i}>
                      <span><b className="mono" style={{ color: 'var(--oro-claro)', marginRight: 8, fontSize: 12 }}>{r.grupo}</b>{r.nombre}</span>
                      <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{r.cantidad}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Vista 2: entrega por asiento */}
            <div>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 14 }}>Lista de entrega</h3>
              <div className="tabla">
                {ordenes.length === 0 ? <div className="tabla-vacia">Sin pedidos pagados todavía.</div> :
                  ordenes.map(o => (
                    <div className="tabla-fila entrega" key={o.id}>
                      <div>
                        <div><b className="mono" style={{ color: 'var(--oro-claro)', marginRight: 10 }}>{o.asiento}</b>{o.nombre_pasajero} <span className="mono" style={{ color: 'rgba(244,238,223,.4)', fontSize: 11, marginLeft: 6 }}>{o.folio}</span></div>
                        <div style={{ fontSize: 13, color: 'rgba(244,238,223,.65)', marginTop: 4 }}>
                          {(o.order_items || []).map((i: any) => `${i.nombre}${i.incluido ? '' : ' ×' + i.cantidad}`).join(' · ')}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .tabla{background:rgba(244,238,223,.05);border:1px solid var(--linea);border-radius:8px;overflow:hidden}
        .tabla-fila{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--linea)}
        .tabla-fila:last-child{border-bottom:none}
        .tabla-fila.entrega{align-items:flex-start}
        .tabla-vacia{padding:22px 18px;color:rgba(244,238,223,.5);font-family:var(--mono);font-size:13px}
        @media(max-width:800px){ .admin-grid{grid-template-columns:1fr!important} }
      `}</style>
    </>
  );
}

function Contador({ n, l }: { n: any; l: string }) {
  return (
    <div style={{ background: 'linear-gradient(150deg,var(--pino),var(--noche-2))', border: '1px solid var(--linea)', borderRadius: 8, padding: '16px 22px', minWidth: 150 }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 30, color: 'var(--oro-claro)', lineHeight: 1 }}>{n}</div>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(244,238,223,.6)', marginTop: 7 }}>{l}</div>
    </div>
  );
}
