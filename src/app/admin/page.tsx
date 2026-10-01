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
  const [busqueda, setBusqueda] = useState('');
  const [entregando, setEntregando] = useState<string | null>(null);

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

  // cargar órdenes de la corrida seleccionada (todas, sin filtrar por pago,
  // para poder ver también las pendientes y su estado de entrega)
  async function recargarOrdenes() {
    if (!corridaId) return;
    setCargando(true);
    const { data } = await sb()
      .from('orders')
      .select('*, order_items(*)')
      .eq('corrida_id', corridaId)
      .order('created_at', { ascending: false });
    setOrdenes(data || []);
    setCargando(false);
  }
  useEffect(() => { recargarOrdenes(); /* eslint-disable-next-line */ }, [corridaId]);

  const corrida = corridas.find(c => c.id === corridaId);

  // búsqueda por nombre o folio
  const ordenesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return ordenes;
    return ordenes.filter(o =>
      (o.nombre_pasajero || '').toLowerCase().includes(q) ||
      (o.folio || '').toLowerCase().includes(q) ||
      (o.folio_grupo || '').toLowerCase().includes(q)
    );
  }, [ordenes, busqueda]);

  // marcar como entregado — update atómico (solo si aún no estaba entregado)
  // para que dos clics simultáneos no lo "entreguen" dos veces.
  async function marcarEntregado(id: string) {
    setEntregando(id);
    const { data } = await sb()
      .from('orders')
      .update({ entregado: true, entregado_at: new Date().toISOString() })
      .eq('id', id)
      .eq('entregado', false)
      .select();
    setEntregando(null);
    if (!data || data.length === 0) {
      // ya estaba entregado (por otro clic/dispositivo) — solo refrescamos
      await recargarOrdenes();
      return;
    }
    setOrdenes(prev => prev.map(o => o.id === id ? { ...o, entregado: true, entregado_at: data[0].entregado_at } : o));
  }

  // Vista 1: resumen de producción (cuánto cocinar) — solo pedidos pagados
  const resumen = useMemo(() => {
    const map = new Map<string, { grupo: string; nombre: string; cantidad: number }>();
    for (const o of ordenes.filter(o => o.estatus_pago === 'pagado'))
      for (const it of (o.order_items || [])) {
        const key = `${it.grupo}|${it.nombre}`;
        const prev = map.get(key);
        map.set(key, { grupo: it.grupo, nombre: it.nombre, cantidad: (prev?.cantidad || 0) + it.cantidad });
      }
    return [...map.values()].sort((a, b) => a.grupo.localeCompare(b.grupo) || a.nombre.localeCompare(b.nombre));
  }, [ordenes]);

  const ordenesPagadas = ordenes.filter(o => o.estatus_pago === 'pagado');
  const totalMenus = ordenesPagadas.length;
  const totalVendido = ordenesPagadas.reduce((s, o) => s + Number(o.total), 0);
  const totalEntregados = ordenesPagadas.filter(o => o.entregado).length;

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

    // Hoja 2: entrega — una fila por pedido pagado, por nombre y folio
    const h2: any[] = [['Folio', 'Folio grupo (ida+vuelta)', 'Nombre de quien recoge', 'Alimentos', 'Leche', 'Alergias', 'Facturación', 'Entregado', 'Fecha de entrega']];
    for (const o of ordenesPagadas) {
      // leche detectada en los nombres de items (ej. "Café Latte (Entera)")
      const leche = (o.order_items || []).map((i: any) => { const m = /\((Entera|Deslactosada)\)/.exec(i.nombre || ''); return m ? m[1] : ''; }).filter(Boolean)[0] || '';
      const alimentos = (o.order_items || []).map((i: any) => `${i.nombre}${i.incluido ? '' : ' ×' + i.cantidad}`).join(', ');
      const fact = o.facturacion ? `RFC ${o.facturacion.rfc} · ${o.facturacion.razon}` : '';
      h2.push([o.folio, o.folio_grupo || '', o.nombre_pasajero, alimentos, leche, o.alergias || '', fact, o.entregado ? 'Sí' : 'No', o.entregado_at ? new Date(o.entregado_at).toLocaleString('es-MX') : '']);
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
              style={{ fontFamily: 'var(--body)', fontSize: 15, padding: '10px 14px', borderRadius: 4, background: '#F4EEDF', color: '#221E16', border: 'none' }}>
              {corridas.map(c => <option key={c.id} value={c.id} style={{ background: '#F4EEDF', color: '#221E16' }}>{etiquetaCorrida(c)}</option>)}
            </select>
          </div>
          <button className="mc-cambiar" onClick={exportarExcel}>Exportar a Excel</button>
        </div>

        {/* contadores */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <Contador n={totalMenus} l="Órdenes pagadas" />
          <Contador n={resumen.reduce((s, r) => s + r.cantidad, 0)} l="Platillos totales" />
          <Contador n={`$${totalVendido.toLocaleString('es-MX')}`} l="Vendido" />
          <Contador n={`${totalEntregados}/${totalMenus}`} l="Entregados" />
        </div>

        {/* búsqueda */}
        <div style={{ marginBottom: 24, maxWidth: 420 }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o folio…"
            style={{ width: '100%', fontFamily: 'var(--body)', fontSize: 14, padding: '10px 14px', borderRadius: 4, background: 'rgba(244,238,223,.08)', color: 'var(--hueso)', border: '1px solid var(--linea)' }}
          />
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

            {/* Vista 2: entrega por nombre + folio */}
            <div>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 14 }}>Lista de entrega</h3>
              <div className="tabla">
                {ordenesFiltradas.length === 0 ? <div className="tabla-vacia">{busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin pedidos todavía.'}</div> :
                  ordenesFiltradas.map(o => (
                    <div className="tabla-fila entrega" key={o.id}>
                      <div style={{ flex: 1 }}>
                        <div>
                          <b style={{ marginRight: 10 }}>{o.nombre_pasajero}</b>
                          <span className="mono" style={{ color: 'rgba(244,238,223,.4)', fontSize: 11, marginLeft: 6 }}>{o.folio}</span>
                          {o.viaje_redondo && <span className="mono" style={{ color: 'var(--oro-claro)', fontSize: 10, marginLeft: 8, border: '1px solid var(--oro)', borderRadius: 999, padding: '2px 8px' }}>⇄ VIAJE REDONDO</span>}
                          <span className="mono" style={{ fontSize: 10, marginLeft: 8, border: '1px solid var(--linea)', borderRadius: 999, padding: '2px 8px', color: o.estatus_pago === 'pagado' ? 'var(--oro-claro)' : 'rgba(244,238,223,.5)' }}>
                            {o.estatus_pago === 'pagado' ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(244,238,223,.65)', marginTop: 4 }}>
                          {(o.order_items || []).map((i: any) => `${i.nombre}${i.incluido ? '' : ' ×' + i.cantidad}`).join(' · ')}
                        </div>
                        {o.alergias && <div style={{ fontSize: 12, color: '#E5A05A', marginTop: 4, fontFamily: 'var(--mono)' }}>⚠ Alergias: {o.alergias}</div>}
                        {o.facturacion && <div style={{ fontSize: 11, color: 'rgba(244,238,223,.5)', marginTop: 3, fontFamily: 'var(--mono)' }}>Factura: RFC {o.facturacion.rfc}</div>}
                        {o.entregado && <div style={{ fontSize: 11, color: 'rgba(244,238,223,.5)', marginTop: 3, fontFamily: 'var(--mono)' }}>✓ Entregado {o.entregado_at ? new Date(o.entregado_at).toLocaleString('es-MX') : ''}</div>}
                      </div>
                      <div>
                        {o.entregado ? (
                          <span className="mono" style={{ fontSize: 11, color: 'var(--oro-claro)' }}>✓ Entregado</span>
                        ) : o.estatus_pago !== 'pagado' ? (
                          <span className="mono" style={{ fontSize: 11, color: 'rgba(244,238,223,.4)' }}>Sin pagar</span>
                        ) : (
                          <button className="btn btn-fantasma" style={{ padding: '8px 14px', fontSize: 12 }} disabled={entregando === o.id} onClick={() => marcarEntregado(o.id)}>
                            {entregando === o.id ? 'Marcando…' : 'Marcar entregado'}
                          </button>
                        )}
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
