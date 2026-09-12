'use client';
import { useMemo, useState } from 'react';
import type { Corrida, MenuItem } from '@/lib/types';
import { GRUPOS, corridaAbierta } from '@/lib/types';
import { convertMXNtoUSD, fmtMXN } from '@/lib/precio';

type Vista = 'hero' | 'corridas' | 'vagon' | 'menu' | 'detalle' | 'resumen' | 'checkout' | 'confirmacion';
type Cart = Record<string, number>;

// Configuración real del tren Xiinbal (ruta Teya → Chichén Itzá):
// 4 vagones — el 1 es Premier, los 2, 3 y 4 son Turista.
const VAGONES = [
  { id: '1', nombre: 'Vagón 1', clase: 'Premier', desc: 'Asientos amplios, servicio preferente a tu lugar.' },
  { id: '2', nombre: 'Vagón 2', clase: 'Turista', desc: 'Clase turista.' },
  { id: '3', nombre: 'Vagón 3', clase: 'Turista', desc: 'Clase turista.' },
  { id: '4', nombre: 'Vagón 4', clase: 'Turista', desc: 'Clase turista.' },
];

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Opciones/variantes por platillo (no toca la BD; se guarda en el nombre).
const OPCIONES: Record<string, { label: string; items: string[]; ingredientes?: Record<string, string> }> = {
  'Chilaquiles': { label: 'Proteína', items: ['Pollo', 'Huevo', 'Sin proteína'] },
  'Baguette': {
    label: 'Escoge tu baguette',
    items: ['Española', 'Italiana', 'Tradicional', 'Premium'],
    ingredientes: {
      'Española': 'Pan tipo baguette, jamón serrano, queso manchego, tomate, aceite de oliva y hojas verdes.',
      'Italiana': 'Pan tipo baguette, salami, jamón, queso mozzarella, tomate, hojas verdes y aderezo tipo pesto.',
      'Tradicional': 'Pan tipo baguette, jamón de pavo, queso manchego, lechuga, tomate, mayonesa y mostaza.',
      'Premium': 'Pan tipo baguette, roast beef, queso gouda, cebolla caramelizada, hojas verdes y aderezo de mostaza Dijon.',
    },
  },
};
const CAT_TODO = 'Todo';

// Íconos de categoría
function IcCat({ g }: { g: string }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (g === 'Todo') return <svg viewBox="0 0 24 24" className="ic" {...c}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
  if (g === 'Desayuno') return <svg viewBox="0 0 24 24" className="ic" {...c}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>;
  if (g === 'Comida') return <svg viewBox="0 0 24 24" className="ic" {...c}><path d="M3 2v7a3 3 0 0 0 3 3v10M6 2v6M21 2c-2 0-3 2-3 5s1 5 3 5v10" /></svg>;
  if (g === 'Bebidas') return <svg viewBox="0 0 24 24" className="ic" {...c}><path d="M6 8h12l-1.5 11a2 2 0 0 1-2 2H9.5a2 2 0 0 1-2-2L6 8zM8 8V5a4 4 0 0 1 8 0v3" /></svg>;
  if (g === 'Botanas') return <svg viewBox="0 0 24 24" className="ic" {...c}><path d="M4 13h16M6 13a6 6 0 0 1 12 0M9 6l1 2M15 5l-1 3M12 4v3" /></svg>;
  if (g === 'Postres') return <svg viewBox="0 0 24 24" className="ic" {...c}><path d="M5 21h14M6 21V10a6 6 0 0 1 12 0v11M12 4V2" /></svg>;
  if (g === 'Acompañamientos') return <svg viewBox="0 0 24 24" className="ic" {...c}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></svg>;
  if (g === 'Menú Infantil') return <svg viewBox="0 0 24 24" className="ic" {...c}><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>;
  if (g === 'Menú Vegano') return <svg viewBox="0 0 24 24" className="ic" {...c}><path d="M12 22c5-2 8-6 8-12V4l-4 1c-4 1-7 4-7 9M12 22c-3-1-5-3-5-7" /></svg>;
  return <svg viewBox="0 0 24 24" className="ic" {...c}><circle cx="12" cy="12" r="8" /></svg>;
}
function Flecha() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function FlechaAtras() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>; }

export default function OrderFlow({ corridas, menu }: { corridas: Corrida[]; menu: MenuItem[] }) {
  const [vista, setVista] = useState<Vista>('hero');
  const [corridaId, setCorridaId] = useState<string | null>(null);
  const [vagon, setVagon] = useState<string | null>(null);
  const [fechaSel, setFechaSel] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [proteinas, setProteinas] = useState<Record<string, string>>({});
  const [catSel, setCatSel] = useState<string>('');
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [datos, setDatos] = useState({ nombre: '', asiento: '', telefono: '', email: '' });
  const [metodo, setMetodo] = useState('tarjeta');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState<any>(null);

  const corrida = useMemo(() => corridas.find(c => c.id === corridaId) || null, [corridaId, corridas]);
  const menuServicio = useMemo(() => (corrida ? menu.filter(m => m.servicio === corrida.servicio) : []), [corrida, menu]);
  const item = (id: string) => menu.find(m => m.id === id);

  const nPlatillos = Object.entries(cart).reduce((a, [id, q]) => a + (item(id)?.incluido ? 0 : q), 0);
  const total = Object.entries(cart).reduce((s, [id, q]) => s + ((item(id)?.precio ?? 0) * q), 0);

  // fechas únicas disponibles
  const fechas = useMemo(() => {
    const set = Array.from(new Set(corridas.map(c => c.fecha))).sort();
    return set;
  }, [corridas]);
  const corridasDeFecha = useMemo(() => corridas.filter(c => c.fecha === fechaSel), [corridas, fechaSel]);

  function ir(v: Vista) {
    if (v === 'checkout' && nPlatillos === 0) return;
    setVista(v);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function elegirCorrida(id: string) {
    setCorridaId(id); setCart({}); setProteinas({}); setVagon(null);
    const c = corridas.find(x => x.id === id);
    setCatSel(CAT_TODO);
    setVista('vagon');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function elegirVagon(v: string) {
    setVagon(v);
    setVista('menu');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cambiarCant(id: string, delta: number) {
    const m = item(id); if (!m) return;
    setCart(prev => {
      const actual = prev[id] || 0;
      const nuevo = Math.max(0, actual + delta);
      const next = { ...prev };
      if (m.principal && delta > 0 && actual === 0) {
        for (const k of Object.keys(next)) {
          const mk = item(k);
          if (mk?.principal && mk.servicio === m.servicio) delete next[k];
        }
      }
      if (nuevo === 0) delete next[id]; else next[id] = nuevo;
      return next;
    });
  }
  function toggleIncluido(id: string) {
    const m = item(id); if (!m) return;
    setCart(prev => {
      const next = { ...prev };
      const yaEstaba = next[id];
      for (const k of Object.keys(next)) {
        const mk = item(k);
        if (mk?.incluido && mk.grupo === m.grupo && mk.servicio === m.servicio) delete next[k];
      }
      if (!yaEstaba) next[id] = 1;
      return next;
    });
  }

  // abrir detalle (solo principales / con proteína); otros se agregan directo
  function abrirDetalle(id: string) { setDetalleId(id); setVista('detalle'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }

  const paso = { corridas: 0, vagon: 0, menu: 1, detalle: 1, resumen: 2, checkout: 2 } as Record<string, number>;

  const vagonSel = VAGONES.find(v => v.id === vagon) || null;

  // nombre con opción elegida (proteína o variante de baguette) para la orden
  function nombreConOpcion(m: MenuItem): string {
    const p = proteinas[m.id];
    if (!p) return m.nombre;
    if (p === 'Sin proteína') return `${m.nombre} (sin proteína)`;
    return `${m.nombre} (${p})`;
  }

  async function pagar() {
    if (!datos.nombre.trim() || !datos.asiento.trim()) { setError('Necesitamos tu nombre y asiento.'); return; }
    setError(''); setCargando(true);
    // El asiento se guarda con el vagón para que cocina sepa dónde entregar.
    const asientoCompleto = vagonSel ? `${vagonSel.nombre} · ${datos.asiento.trim()}` : datos.asiento.trim();
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corridaId, datos: { ...datos, asiento: asientoCompleto },
          lineas: Object.entries(cart).map(([menu_item_id, cantidad]) => {
            const m = item(menu_item_id);
            return { menu_item_id, cantidad, nombre_override: m ? nombreConOpcion(m) : undefined };
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo procesar el pago.');
      if (data.url) { window.location.href = data.url; return; }
      setComprobante(data.comprobante); ir('confirmacion');
    } catch (e: any) { setError(e.message || 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }

  const corridaCortaTxt = corrida ? `${new Date(corrida.fecha + 'T12:00').getDate()} ${MESES[new Date(corrida.fecha + 'T12:00').getMonth()]} · ${corrida.hora_salida?.slice(0, 5)}` : '';
  const corridaFullTxt = corrida ? `${corridaCortaTxt} · ${corrida.sentido}` : '';

  const Marca = ({ small }: { small?: boolean }) => (
    <div className="brand" onClick={() => ir('hero')}>
      <div className="wordmark" style={small ? { fontSize: 15 } : {}}>Tren Maya<span className="sub">Restaurante</span></div>
    </div>
  );

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <Marca small />
          <div className="paso-ind">{[0, 1, 2].map(i => <i key={i} className={paso[vista] !== undefined && i <= paso[vista] ? 'on' : ''} />)}</div>
        </div>
      </header>

      {/* ===== HERO / BIENVENIDA ===== */}
      {vista === 'hero' && (
        <section className="vista activa">
          <div className="hero wrap">
            <div className="chichen"><img src="/chichen.webp" alt="" aria-hidden="true" /></div>
            <div className="hero-in">
              <span className="oficial"><span className="dot" />Servicio oficial de alimentos · Teya – Chichén Itzá</span>
              <h1>Tu comida, apartada <em>antes</em> de abordar.</h1>
              <p className="lead">Aparta y paga tu desayuno o comida para tu corrida de fin de semana. Lo preparamos para tu asiento, sin filas ni esperas a bordo.</p>

              <div className="ruta-hero">
                <div className="ruta-card">
                  <div className="rc-pt"><div className="rc-l">Origen</div><div className="rc-ciudad">Teya</div><div className="rc-sub">Mérida, Yucatán</div></div>
                  <div className="rc-flecha">→</div>
                  <div className="rc-pt" style={{ textAlign: 'right' }}><div className="rc-l">Destino</div><div className="rc-ciudad">Chichén Itzá</div><div className="rc-sub">Yucatán</div></div>
                </div>
              </div>

              <button className="btn btn-primario" onClick={() => { setFechaSel(fechas[0] ?? null); ir('corridas'); }}>Ver corridas disponibles <Flecha /></button>

              <div className="hero-datos">
                <div className="d"><div className="n">3 tiempos</div><div className="l">Desayuno</div></div>
                <div className="d"><div className="n">Snacks</div><div className="l">A media ruta</div></div>
                <div className="d"><div className="n">3 tiempos</div><div className="l">Comida</div></div>
                <div className="d"><div className="n">100%</div><div className="l">Cocina yucateca</div></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== CORRIDAS (fechas + horarios) ===== */}
      {vista === 'corridas' && (
        <section className="vista activa">
          <div className="wrap seccion">
            <button className="volver" onClick={() => ir('hero')}><FlechaAtras />Volver al inicio</button>
            <div className="sec-head"><span className="eyebrow">Paso 1 · Selección de corrida</span><h2>Corridas disponibles</h2><p>Teya → Chichén Itzá · Elige tu fecha y horario. El menú se prepara para ese viaje.</p></div>

            <div className="fechas-row">
              {fechas.map(f => {
                const d = new Date(f + 'T12:00');
                return (
                  <div key={f} className={`fecha-chip${fechaSel === f ? ' activa' : ''}`} onClick={() => setFechaSel(f)}>
                    <div className="dow">{DOW[d.getDay()]}</div>
                    <div className="dia">{d.getDate()}</div>
                    <div className="mes">{MESES[d.getMonth()]}</div>
                  </div>
                );
              })}
            </div>

            <div className="horarios">
              {corridasDeFecha.map(c => {
                const abierta = corridaAbierta(c);
                const restan = c.cupo != null ? c.cupo - (c.vendidos ?? 0) : null;
                return (
                  <div key={c.id} className={`horario${!abierta ? ' cerrado' : ''}`}>
                    <div>
                      <div className="h-hora">{c.hora_salida?.slice(0, 5)}</div>
                      <div className="h-info">{c.sentido}</div>
                      {c.cupo != null && abierta && <div className="h-cupo">Quedan {restan} lugares</div>}
                      {c.cupo == null && abierta && <div className="h-dur">Venta abierta</div>}
                    </div>
                    {abierta
                      ? <button className="btn btn-primario" style={{ padding: '12px 22px', fontSize: 14 }} onClick={() => elegirCorrida(c.id)}>Seleccionar</button>
                      : <button className="btn btn-fantasma" style={{ padding: '12px 22px', fontSize: 14 }} disabled>No disponible</button>}
                  </div>
                );
              })}
              {corridasDeFecha.length === 0 && <p style={{ color: 'var(--hueso-2)' }}>No hay corridas para esta fecha.</p>}
            </div>
          </div>
        </section>
      )}

      {/* ===== SELECCIÓN DE VAGÓN ===== */}
      {vista === 'vagon' && corrida && (
        <section className="vista activa">
          <div className="wrap seccion">
            <button className="volver" onClick={() => ir('corridas')}><FlechaAtras />Volver a corridas</button>
            <div className="menu-corrida" style={{ marginBottom: 22 }}>
              <div className="mc-l">
                <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" /><circle cx="12" cy="9" r="2" /></svg>
                <div><div className="mc-fecha">{new Date(corrida.fecha + 'T12:00').getDate()} de {MESES_L[new Date(corrida.fecha + 'T12:00').getMonth()]}</div><div style={{ fontSize: 11, color: 'var(--hueso-2)' }}>{corrida.sentido} · {corrida.hora_salida?.slice(0, 5)}</div></div>
              </div>
              <button className="mc-cambiar" onClick={() => ir('corridas')}>Cambiar</button>
            </div>

            <div className="sec-head"><span className="eyebrow">Paso 1 · Tu vagón</span><h2>¿En qué vagón viajas?</h2><p>Selecciona tu vagón para llevarte la comida directo a tu asiento. Lo encuentras en tu boleto del Tren Maya.</p></div>

            <div className="vagones">
              {VAGONES.map(v => (
                <div key={v.id} className={`vagon-card${vagon === v.id ? ' sel' : ''} ${v.clase === 'Premier' ? 'premier' : ''}`} onClick={() => elegirVagon(v.id)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') elegirVagon(v.id); }}>
                  <div className="vg-ic">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="3" /><path d="M3 11h18" /><circle cx="8" cy="14" r="1" /><circle cx="16" cy="14" r="1" /><path d="M6 21l2-3M18 21l-2-3" /></svg>
                  </div>
                  <div className="vg-body">
                    <div className="vg-top"><div className="vg-nombre">{v.nombre}</div><span className={`vg-clase${v.clase === 'Premier' ? ' premier' : ''}`}>{v.clase}</span></div>
                    <div className="vg-desc">{v.desc}</div>
                  </div>
                  <div className="vg-flecha"><Flecha /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== MENÚ (categorías + tarjetas) ===== */}
      {vista === 'menu' && corrida && (
        <section className="vista activa">
          <div className="wrap seccion" style={{ paddingBottom: 130 }}>
            <button className="volver" onClick={() => ir('corridas')}><FlechaAtras />Volver a corridas</button>
            <div className="menu-corrida">
              <div className="mc-l">
                <svg className="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" /><circle cx="12" cy="9" r="2" /></svg>
                <div><div className="mc-fecha">{new Date(corrida.fecha + 'T12:00').getDate()} de {MESES_L[new Date(corrida.fecha + 'T12:00').getMonth()]}</div><div style={{ fontSize: 11, color: 'var(--hueso-2)' }}>{corrida.sentido} · {corrida.hora_salida?.slice(0, 5)}{vagonSel ? ` · ${vagonSel.nombre}` : ''}</div></div>
              </div>
              <button className="mc-cambiar" onClick={() => ir('vagon')}>Cambiar</button>
            </div>

            <div className="sec-head" style={{ marginBottom: 18 }}><span className="eyebrow">Paso 2 · Menú</span><h2>¿Qué quieres comer?</h2><p>Sabores que acompañan tu ruta.</p></div>

            {/* categorías */}
            <div className="cats">
              <div className={`cat${catSel === CAT_TODO ? ' activa' : ''}`} onClick={() => setCatSel(CAT_TODO)}>
                <IcCat g={CAT_TODO} /><span className="nb">Todo</span>
              </div>
              {GRUPOS[corrida.servicio].filter(g => menuServicio.some(m => m.grupo === g.nombre)).map(g => (
                <div key={g.nombre} className={`cat${catSel === g.nombre ? ' activa' : ''}`} onClick={() => setCatSel(g.nombre)}>
                  <IcCat g={g.nombre} /><span className="nb">{g.nombre}</span>
                </div>
              ))}
            </div>

            {/* platillos: Todo = por grupos; categoría = un grupo */}
            {(() => {
              const grupos = catSel === CAT_TODO
                ? GRUPOS[corrida.servicio].filter(g => menuServicio.some(m => m.grupo === g.nombre))
                : GRUPOS[corrida.servicio].filter(g => g.nombre === catSel);
              return grupos.map(g => {
                const items = menuServicio.filter(m => m.grupo === g.nombre);
                if (!items.length) return null;
                return (
                  <div key={g.nombre}>
                    {catSel === CAT_TODO && (
                      <div className="grupo-titulo"><h3>{g.nombre}</h3><span className="barra" /></div>
                    )}
                    {g.hint && <div className="grupo-hint" style={{ marginTop: catSel === CAT_TODO ? 0 : 18 }}>{g.hint}</div>}
                    <div className="platillos" style={{ marginTop: g.hint ? 0 : (catSel === CAT_TODO ? 4 : 18) }}>
                      {items.map(m => <Tarjeta key={m.id} m={m} cant={cart[m.id] || 0} cambiarCant={cambiarCant} toggleIncluido={toggleIncluido} abrirDetalle={abrirDetalle} />)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {nPlatillos > 0 && (
            <div className="pedido-barra visible">
              <div className="pb-in" onClick={() => ir('resumen')}>
                <div className="pb-txt"><span className="n">{nPlatillos}</span> {nPlatillos === 1 ? 'producto' : 'productos'} · <span className="n">${fmtMXN(total)}</span> <span style={{ opacity: .7, fontSize: 11 }}>≈ US${convertMXNtoUSD(total)}</span></div>
                <div className="pb-cta">Ver mi pedido <Flecha /></div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== DETALLE DE PLATILLO ===== */}
      {vista === 'detalle' && detalleId && (() => {
        const m = item(detalleId); if (!m) return null;
        const cant = cart[m.id] || 0;
        const opc = OPCIONES[m.nombre];
        const opts = opc?.items;
        const sel = opts ? (proteinas[m.id] || opts[0]) : undefined;
        const ingr = opc?.ingredientes && sel ? opc.ingredientes[sel] : undefined;
        return (
          <section className="vista activa">
            <div className="wrap seccion detalle">
              <button className="volver" onClick={() => ir('menu')}><FlechaAtras />Volver al menú</button>
              {m.imagen ? <div className="detalle-foto"><img src={m.imagen} alt={m.nombre} /></div> : <div className="detalle-foto ph"><PlaceIcon grande /></div>}
              <h2>{m.nombre}</h2>
              <div className="d-precio">${fmtMXN(m.precio)} <span style={{ fontSize: 12, color: 'var(--hueso-2)' }}>MXN</span></div>
              <div className="d-usd">≈ US${convertMXNtoUSD(m.precio)}</div>
              {m.descripcion && <p className="d-desc">{m.descripcion}</p>}

              {opts && (
                <div className="opciones-g">
                  <div className="og-l">{opc.label}</div>
                  <div className="opciones-chips">
                    {opts.map(o => (
                      <div key={o} className={`op-chip${sel === o ? ' sel' : ''}`} onClick={() => setProteinas(p => ({ ...p, [m.id]: o }))}>{o}</div>
                    ))}
                  </div>
                  {ingr && <p className="og-ingr">{ingr}</p>}
                </div>
              )}

              <div className="opciones-g">
                <div className="og-l">Cantidad</div>
                <div className="stepper-mini" style={{ width: 'fit-content' }}>
                  <button onClick={() => cambiarCant(m.id, -1)}>−</button>
                  <span className="c">{cant || 1}</span>
                  <button onClick={() => cambiarCant(m.id, 1)}>+</button>
                </div>
              </div>

              <button className="btn btn-primario" style={{ width: '100%' }} onClick={() => {
                if (cant === 0) { if (opts && !proteinas[m.id]) setProteinas(p => ({ ...p, [m.id]: opts[0] })); cambiarCant(m.id, 1); }
                ir('menu');
              }}>{cant > 0 ? 'Actualizar pedido' : 'Agregar al pedido'} · ${fmtMXN(m.precio * (cant || 1))}</button>
            </div>
          </section>
        );
      })()}

      {/* ===== RESUMEN DEL PEDIDO ===== */}
      {vista === 'resumen' && corrida && (
        <section className="vista activa">
          <div className="wrap seccion">
            <button className="volver" onClick={() => ir('menu')}><FlechaAtras />Seguir eligiendo</button>
            <div className="sec-head" style={{ marginBottom: 22 }}><span className="eyebrow">Paso 3 · Resumen</span><h2>Tu pedido</h2></div>

            <div className="menu-corrida" style={{ marginBottom: 18, maxWidth: 640 }}>
              <div className="mc-l"><div><div className="mc-fecha">{corrida.sentido}</div><div style={{ fontSize: 11, color: 'var(--hueso-2)' }}>{new Date(corrida.fecha + 'T12:00').getDate()} {MESES_L[new Date(corrida.fecha + 'T12:00').getMonth()]} · {corrida.hora_salida?.slice(0, 5)}</div></div></div>
              <button className="mc-cambiar" onClick={() => ir('corridas')}>Cambiar</button>
            </div>

            <div className="resumen-wrap">
              {Object.entries(cart).map(([id, q]) => {
                const m = item(id); if (!m) return null;
                return (
                  <div className="linea-prod" key={id}>
                    {m.imagen ? <div className="lp-foto"><img src={m.imagen} alt="" /></div> : <div className="lp-foto" />}
                    <div className="lp-mid">
                      <div className="lp-nombre">{nombreConOpcion(m)}</div>
                      <div className="lp-sub">{m.grupo}{m.incluido ? ' · incluido' : ''}</div>
                    </div>
                    {!m.incluido && (
                      <div className="stepper-mini"><button onClick={() => cambiarCant(id, -1)}>−</button><span className="c">{q}</span><button onClick={() => cambiarCant(id, 1)}>+</button></div>
                    )}
                    <div className={m.incluido ? 'lp-inc' : 'lp-precio'}>{m.incluido ? 'Incluido' : `$${(m.precio * q).toLocaleString('es-MX')}`}</div>
                  </div>
                );
              })}
              <div className="agregar-mas" onClick={() => ir('menu')}><span>+ Agregar más productos</span><Flecha /></div>

              <div className="totales">
                <div className="fila"><span>Subtotal</span><span className="mono">${fmtMXN(total)}</span></div>
                <div className="fila total"><span className="t">Total</span><span style={{ textAlign: 'right' }}><span className="m">${fmtMXN(total)}</span><div className="usd-total">≈ US${convertMXNtoUSD(total)}</div></span></div>
              </div>

              <button className="btn btn-primario" style={{ width: '100%' }} onClick={() => ir('checkout')} disabled={nPlatillos === 0}>Continuar al pago <Flecha /></button>
            </div>
          </div>
        </section>
      )}

      {/* ===== CHECKOUT / PAGO ===== */}
      {vista === 'checkout' && corrida && (
        <section className="vista activa">
          <div className="wrap seccion">
            <button className="volver" onClick={() => ir('resumen')}><FlechaAtras />Volver al pedido</button>
            <div className="sec-head" style={{ marginBottom: 26 }}><span className="eyebrow">Paso 4 · Pago</span><h2>Pago seguro</h2><p>Registramos tu asiento y nombre para entregarte tu comida a bordo.</p></div>

            <div className="checkout">
              <div>
                <div className="form-card" style={{ marginBottom: 18 }}>
                  <h3>Datos del pasajero</h3>
                  <p className="sub">Estos datos aparecen en tu ticket y los verifica el personal a bordo.</p>
                  <div className="campo"><label>Nombre del pasajero</label><input value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} placeholder="Ej. Juanito Pérez" /></div>
                  <div className="campo mitad">
                    <div><label>Asiento{vagonSel ? ` · ${vagonSel.nombre}` : ''}</label><input value={datos.asiento} onChange={e => setDatos({ ...datos, asiento: e.target.value })} placeholder="Ej. 12B" /><div className="nota">{vagonSel ? <>Vagón y asiento de tu boleto del Tren Maya. <span onClick={() => ir('vagon')} style={{ color: 'var(--oro-claro)', cursor: 'pointer' }}>Cambiar vagón</span></> : 'Lo encuentras en tu boleto del Tren Maya.'}</div></div>
                    <div><label>Teléfono</label><input value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} placeholder="999 123 4567" /></div>
                  </div>
                  <div className="campo"><label>Correo (para tu ticket)</label><input type="email" value={datos.email} onChange={e => setDatos({ ...datos, email: e.target.value })} placeholder="tucorreo@ejemplo.com" /></div>
                </div>

                <div className="form-card">
                  <h3>Método de pago</h3>
                  <p className="sub">Procesado de forma segura con Stripe.</p>
                  <div className="pago-metodos">
                    {[['tarjeta', 'Tarjeta de crédito o débito'], ['apple', 'Apple Pay'], ['google', 'Google Pay']].map(([k, l]) => (
                      <div key={k} className={`metodo${metodo === k ? ' sel' : ''}`} onClick={() => setMetodo(k)}><span className="radio" /><span className="m-nombre">{l}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="resumen-lado">
                <h3>Total a pagar</h3>
                <div className="rc-corrida">{corridaFullTxt}</div>
                {Object.entries(cart).map(([id, q]) => {
                  const m = item(id); if (!m) return null;
                  return <div className="rc-linea" key={id}>{m.incluido ? <span className="izq">{m.nombre}</span> : <span className="izq"><b>{q}×</b>{nombreConOpcion(m)}</span>}{m.incluido ? <span className="der" style={{ color: 'var(--oro-claro)' }}>Incluido</span> : <span className="der">${(m.precio * q).toLocaleString('es-MX')}</span>}</div>;
                })}
                <div className="rc-total"><span className="t">Total</span><span style={{ textAlign: 'right' }}><span className="m">${fmtMXN(total)}</span><div className="usd-total">≈ US${convertMXNtoUSD(total)}</div></span></div>
                {error && <div style={{ color: '#E8A', fontSize: 13, marginTop: 12, fontFamily: 'var(--mono)' }}>{error}</div>}
                <button className="btn btn-primario rc-pagar" onClick={pagar} disabled={cargando}>{cargando ? 'Procesando…' : `Pagar $${total.toLocaleString('es-MX')} MXN`}</button>
                <div className="seguro"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>Tus datos están protegidos</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== TICKET (QR) ===== */}
      {vista === 'confirmacion' && comprobante && (
        <section className="vista activa">
          <div className="wrap seccion">
            <div className="conf">
              <div className="check"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22190E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></div>
              <h2>¡Tu comida está reservada!</h2>
              <p className="sub">Presenta este QR al personal a bordo para recibir tu pedido.</p>
              <div className="folio-l">Pedido {comprobante.folio}</div>

              <div className="ticket">
                <div className="ticket-qr"><QR texto={`TRENMAYA|${comprobante.folio}|${comprobante.asiento}|${comprobante.corridaCorta}`} /></div>
                <div className="ticket-body">
                  <div className="ticket-ruta">{comprobante.sentido}</div>
                  <div className="ticket-corrida">{comprobante.corridaCorta} · Asiento {comprobante.asiento}</div>
                  <div className="ticket-items">
                    {comprobante.items.map((it: any, i: number) => (
                      <div className="ti" key={i}><span className="n"><b>{it.grupo}</b>{it.nombre}</span><span className="q">{it.incluido ? 'Incluido' : '×' + it.cantidad}</span></div>
                    ))}
                    <div className="ticket-total"><span>Total</span><span style={{ textAlign: 'right' }}><span className="m">${fmtMXN(comprobante.total ?? total)}</span><div className="usd-total" style={{ fontSize: 11 }}>≈ US${convertMXNtoUSD(comprobante.total ?? total)}</div></span></div>
                  </div>
                  <div className="ticket-msg">Guarda este ticket. Lo necesitas para recibir tu comida durante el trayecto.</div>
                </div>
              </div>

              <div className="conf-acciones">
                <button className="btn btn-primario" onClick={() => window.print()}>Guardar ticket</button>
                <button className="btn btn-fantasma" onClick={() => { setCart({}); setProteinas({}); setCorridaId(null); setComprobante(null); setDatos({ nombre: '', asiento: '', telefono: '', email: '' }); ir('hero'); }}>Hacer otro pedido</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer>
        <div className="wrap foot-in">
          <span className="cita">“Un viaje inolvidable también se saborea.”</span>
          <span className="mono">TREN MAYA · MÉXICO</span>
        </div>
      </footer>
    </>
  );
}

/* ===== Tarjeta de producto ===== */
function Tarjeta({ m, cant, cambiarCant, toggleIncluido, abrirDetalle }: {
  m: MenuItem; cant: number;
  cambiarCant: (id: string, d: number) => void;
  toggleIncluido: (id: string) => void;
  abrirDetalle: (id: string) => void;
}) {
  // acompañamiento incluido = selección única
  if (m.incluido) {
    const sel = cant > 0;
    return (
      <div className={`platillo incluido${sel ? ' activo' : ''}`}>
        <div className="plat-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div className="plat-nombre" style={{ fontSize: 17 }}>{m.nombre}</div><span className="sin-costo">Sin costo</span></div>
          <button className={`toggle-inc${sel ? ' sel' : ''}`} onClick={() => toggleIncluido(m.id)}>{sel ? '✓ Elegido' : 'Elegir'}</button>
        </div>
      </div>
    );
  }
  const badge = m.principal ? <span className="plat-badge">Principal</span> : m.vegano ? <span className="plat-badge veg">Vegano</span> : m.alcohol ? <span className="plat-badge alc">+18</span> : null;
  const tieneOpciones = !!OPCIONES[m.nombre];
  const tienenDetalle = m.principal || tieneOpciones; // principales / con opciones abren detalle
  return (
    <div className={`platillo${cant > 0 ? ' activo' : ''}`}>
      <div className="plat-foto" onClick={() => tienenDetalle && abrirDetalle(m.id)}>
        {badge}
        {m.imagen ? <img src={m.imagen} alt={m.nombre} loading="lazy" /> : <div className="ph-inner"><PlaceIcon /></div>}
      </div>
      <div className="plat-body">
        <div className="plat-nombre">{m.nombre}</div>
        {m.descripcion && <div className="plat-desc">{m.descripcion}</div>}
        <div className="plat-row">
          <div>
            <div className="plat-precio">${fmtMXN(m.precio)}<span className="mx">MXN</span></div>
            <div className="plat-usd">≈ US${convertMXNtoUSD(m.precio)}</div>
          </div>
          {tieneOpciones && cant === 0
            ? <button className="btn-personalizar" onClick={() => abrirDetalle(m.id)}>Personalizar</button>
            : cant === 0
              ? <button className="add-btn" onClick={() => (tienenDetalle ? abrirDetalle(m.id) : cambiarCant(m.id, 1))} aria-label="Agregar">+</button>
              : <div className="stepper-mini"><button onClick={() => cambiarCant(m.id, -1)}>−</button><span className="c">{cant}</span><button onClick={() => cambiarCant(m.id, 1)}>+</button></div>}
        </div>
      </div>
    </div>
  );
}

// Ícono placeholder elegante para productos sin fotografía
function PlaceIcon({ grande }: { grande?: boolean }) {
  const s = grande ? 54 : 34;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
      <path d="M3 11h18M5 11a7 7 0 0 1 14 0M12 3v1M8 20h8M10 20l-.5-3M14 20l.5-3" />
    </svg>
  );
}

/* ===== QR (genera en canvas con la librería qrcode) ===== */
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
function QR({ texto }: { texto: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) QRCode.toCanvas(ref.current, texto, { width: 190, margin: 1, color: { dark: '#0A1613', light: '#F4EEDF' } }).catch(() => { });
  }, [texto]);
  return <canvas ref={ref} width={190} height={190} />;
}
