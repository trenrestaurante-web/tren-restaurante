'use client';
import { useMemo, useState } from 'react';
import type { Corrida, MenuItem } from '@/lib/types';
import { GRUPOS, corridaAbierta } from '@/lib/types';

type Vista = 'hero' | 'corridas' | 'menu' | 'checkout' | 'confirmacion';
type Cart = Record<string, number>;

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function Flecha() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
function FlechaAtras() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
}

export default function OrderFlow({ corridas, menu }: { corridas: Corrida[]; menu: MenuItem[] }) {
  const [vista, setVista] = useState<Vista>('hero');
  const [corridaId, setCorridaId] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [datos, setDatos] = useState({ nombre: '', asiento: '', telefono: '', email: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [comprobante, setComprobante] = useState<any>(null);

  const corrida = useMemo(() => corridas.find(c => c.id === corridaId) || null, [corridaId, corridas]);
  const menuServicio = useMemo(
    () => (corrida ? menu.filter(m => m.servicio === corrida.servicio) : []),
    [corrida, menu]
  );
  const item = (id: string) => menu.find(m => m.id === id);

  const nPlatillos = Object.entries(cart).reduce((a, [id, q]) => a + (item(id)?.incluido ? 0 : q), 0);
  const total = Object.entries(cart).reduce((s, [id, q]) => s + ((item(id)?.precio ?? 0) * q), 0);

  function ir(v: Vista) {
    if (v === 'checkout' && nPlatillos === 0) return;
    setVista(v);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function elegirCorrida(id: string) {
    setCorridaId(id);
    setCart({});
    setVista('menu');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cambiarCant(id: string, delta: number) {
    const m = item(id); if (!m) return;
    setCart(prev => {
      const actual = prev[id] || 0;
      const nuevo = Math.max(0, actual + delta);
      const next = { ...prev };
      // un solo principal por orden
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

  const paso = { corridas: 0, menu: 1, checkout: 2 } as Record<string, number>;

  async function pagar() {
    if (!datos.nombre.trim() || !datos.asiento.trim()) {
      setError('Necesitamos tu nombre y asiento.'); return;
    }
    setError(''); setCargando(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corridaId,
          datos,
          lineas: Object.entries(cart).map(([menu_item_id, cantidad]) => ({ menu_item_id, cantidad })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo procesar el pago.');
      if (data.url) { window.location.href = data.url; return; }       // Stripe real
      setComprobante(data.comprobante);                                 // modo demo
      ir('confirmacion');
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error.');
    } finally { setCargando(false); }
  }

  const corridaTxt = corrida
    ? `${new Date(corrida.fecha + 'T12:00').getDate()} ${MESES[new Date(corrida.fecha + 'T12:00').getMonth()].toUpperCase()} · ${corrida.sentido} · ${corrida.hora_salida?.slice(0,5)} HRS`
    : '';

  return (
    <>
      {/* topbar */}
      <header className="top">
        <div className="wrap top-in">
          <div className="brand" onClick={() => ir('hero')}>
            <div className="sello">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="16" height="14" rx="3" /><path d="M4 11h16" /><circle cx="8.5" cy="14" r="1.2" /><circle cx="15.5" cy="14" r="1.2" /><path d="M7 21l2-3M17 21l-2-3" />
              </svg>
            </div>
            <div><b>Tren Restaurante</b><span>Servicio a bordo · Tren Maya</span></div>
          </div>
          <div className="paso-ind">
            {[0, 1, 2].map(i => <i key={i} className={paso[vista] !== undefined && i <= paso[vista] ? 'on' : ''} />)}
          </div>
        </div>
      </header>

      {/* HERO */}
      {vista === 'hero' && (
        <section className="vista activa">
          <div className="hero">
            <div className="hero-bg">
              <div className="cielo" />
              <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" fill="none">
                <path d="M0 400 L0 300 L520 300 L600 150 L680 300 L1200 300 L1200 400 Z" fill="#0A2C25" />
                <path d="M600 150 L560 230 L640 230 Z" fill="#123D34" />
                <path d="M0 400 L0 340 L1200 340 L1200 400 Z" fill="#071F1A" />
              </svg>
            </div>
            <div className="wrap hero-in">
              <span className="oficial"><span className="dot" />Servicio oficial de alimentos · Ruta Teya – Chichén Itzá</span>
              <h1>Tu comida, apartada <em>antes</em> de abordar.</h1>
              <p className="lead">Aparta y paga tu desayuno o comida para tu corrida de fin de semana. Lo preparamos para tu asiento — sin filas ni esperas a bordo.</p>
              <div className="ruta ruta-hero">
                <span className="pto" /><span className="nombre">Teya</span><span className="via" /><span className="nombre">Chichén Itzá</span><span className="pto dest" />
              </div>
              <button className="btn btn-primario" onClick={() => ir('corridas')}>Escoger mi corrida <Flecha /></button>
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

      {/* CORRIDAS */}
      {vista === 'corridas' && (
        <section className="vista activa">
          <div className="wrap seccion">
            <button className="volver" onClick={() => ir('hero')}><FlechaAtras />Volver al inicio</button>
            <div className="sec-head">
              <span className="eyebrow">Paso 1 de 3 · Selección de corrida</span>
              <h2>¿Cuándo viajas?</h2>
              <p>Selecciona la fecha y el sentido de tu corrida. El menú se prepara especialmente para ese viaje, por lo que la venta en línea cierra dos días antes.</p>
            </div>
            <div className="corridas">
              {corridas.map(c => {
                const abierta = corridaAbierta(c);
                const restan = c.cupo != null ? c.cupo - (c.vendidos ?? 0) : null;
                const lleno = c.cupo != null && (c.vendidos ?? 0) >= c.cupo;
                const d = new Date(c.fecha + 'T12:00');
                return (
                  <div key={c.id}
                    className={`boleto ${c.servicio === 'tarde' ? 'regreso' : ''} ${!abierta ? 'cerrado' : ''}`}
                    onClick={() => abierta && elegirCorrida(c.id)}
                    tabIndex={abierta ? 0 : -1}
                    onKeyDown={e => { if (abierta && e.key === 'Enter') elegirCorrida(c.id); }}>
                    <div className="banda" />
                    <div className="bol-inner">
                      <div className="bol-top">
                        <div>
                          <div className="bol-fecha">{MESES[d.getMonth()]}</div>
                          <div className="bol-dia">{d.getDate()}</div>
                          <div className="bol-dow">Sábado</div>
                        </div>
                        <span className="bol-tag">{c.hora_salida?.slice(0,5)} hrs</span>
                      </div>
                      <div className="ruta bol-ruta">
                        <span className="pto" /><span className="nombre">{c.sentido.split(' → ')[0]}</span><span className="via" /><span className="nombre">{c.sentido.split(' → ')[1]}</span><span className="pto dest" />
                      </div>
                      <div className="perf" />
                      <div className="bol-bottom">
                        {c.cupo == null
                          ? <span className="bol-cupo">Venta abierta</span>
                          : lleno
                            ? <span className="bol-cupo lleno bol-cerrado-msg">Agotado en línea</span>
                            : <span className="bol-cupo">Quedan <b>{restan}</b> lugares</span>}
                        {abierta
                          ? <span className="bol-ir">Ver menú <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
                          : <span className="bol-cerrado-msg">Cerrado</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MENU */}
      {vista === 'menu' && corrida && (
        <section className="vista activa">
          <div className="wrap seccion" style={{ paddingBottom: 130 }}>
            <button className="volver" onClick={() => ir('corridas')}><FlechaAtras />Volver a corridas</button>
            <div className="sec-head" style={{ marginBottom: 22 }}>
              <span className="eyebrow">Paso 2 de 3 · Selección de menú</span>
              <h2>Arma tu menú</h2>
            </div>
            <div className="menu-corrida">
              <div className="mc-l">
                <div className="mc-fecha">{new Date(corrida.fecha + 'T12:00').getDate()} de {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][new Date(corrida.fecha + 'T12:00').getMonth()]}</div>
                <div className="ruta" style={{ color: 'var(--cal)' }}>
                  <span className="pto" /><span>{corrida.sentido.split(' → ')[0]}</span><span className="via" /><span>{corrida.sentido.split(' → ')[1]}</span><span className="pto dest" />
                </div>
                <span className="bol-tag mono" style={{ background: 'rgba(201,164,94,.15)', color: 'var(--oro-claro)', borderColor: 'rgba(201,164,94,.3)' }}>{corrida.hora_salida?.slice(0,5)} hrs</span>
              </div>
              <button className="mc-cambiar" onClick={() => ir('corridas')}>Cambiar corrida</button>
            </div>

            {GRUPOS[corrida.servicio].map((g, idx) => {
              const items = menuServicio.filter(m => m.grupo === g.nombre);
              if (!items.length) return null;
              return (
                <div className="tiempo-grupo" key={g.nombre}>
                  <div className="tiempo-titulo"><span className="n">0{idx + 1}</span><h3>{g.nombre}</h3><span className="barra" /></div>
                  {g.hint && <div className="grupo-hint">{g.hint}</div>}
                  <div className="platillos">
                    {items.map(m => <Tarjeta key={m.id} m={m} cant={cart[m.id] || 0} cambiarCant={cambiarCant} toggleIncluido={toggleIncluido} />)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`carrito-barra${nPlatillos > 0 ? ' visible' : ''}`}>
            <div className="cb-in">
              <div className="cb-resumen">
                <span className="cb-items">{nPlatillos === 1 ? '1 platillo' : `${nPlatillos} platillos`}</span>
                <span className="cb-total">${total.toLocaleString('es-MX')} <span>MXN</span></span>
              </div>
              <button className="btn btn-primario" onClick={() => ir('checkout')}>Continuar <Flecha /></button>
            </div>
          </div>
        </section>
      )}

      {/* CHECKOUT */}
      {vista === 'checkout' && corrida && (
        <section className="vista activa">
          <div className="wrap seccion">
            <button className="volver" onClick={() => ir('menu')}><FlechaAtras />Volver al menú</button>
            <div className="sec-head" style={{ marginBottom: 30 }}>
              <span className="eyebrow">Paso 3 de 3 · Datos del pasajero</span>
              <h2>Últimos datos</h2>
              <p>Registramos tu asiento y nombre para entregarte tu comida a bordo.</p>
            </div>
            <div className="checkout">
              <div className="form-card">
                <h3>Datos del pasajero</h3>
                <p className="sub">Estos datos aparecen en tu comprobante y son los que verifica el personal en el tren.</p>
                <div className="campo">
                  <label>Nombre del pasajero</label>
                  <input value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} placeholder="Ej. Juanito Pérez" />
                </div>
                <div className="campo mitad-cont">
                  <div>
                    <label>Asiento</label>
                    <input value={datos.asiento} onChange={e => setDatos({ ...datos, asiento: e.target.value })} placeholder="Ej. 8B" />
                    <div className="nota-asiento">Lo encuentras en tu boleto del Tren Maya.</div>
                  </div>
                  <div>
                    <label>Teléfono (WhatsApp)</label>
                    <input value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} placeholder="999 123 4567" />
                  </div>
                </div>
                <div className="campo">
                  <label>Correo (para tu comprobante)</label>
                  <input type="email" value={datos.email} onChange={e => setDatos({ ...datos, email: e.target.value })} placeholder="tucorreo@ejemplo.com" />
                </div>
              </div>

              <div className="resumen-card">
                <h3>Resumen de compra</h3>
                <div className="rc-corrida">{corridaTxt}</div>
                <div>
                  {Object.entries(cart).map(([id, q]) => {
                    const m = item(id); if (!m) return null;
                    return (
                      <div className="rc-linea" key={id}>
                        {m.incluido ? <span className="izq">{m.nombre}</span> : <span className="izq"><b>{q}×</b>{m.nombre}</span>}
                        {m.incluido ? <span className="der" style={{ color: 'var(--oro-claro)' }}>Incluido</span> : <span className="der">${(m.precio * q).toLocaleString('es-MX')}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="rc-total"><span className="t">Total</span><span className="m">${total.toLocaleString('es-MX')}</span></div>
                {error && <div style={{ color: '#E88', fontSize: 13, marginTop: 12, fontFamily: 'var(--mono)' }}>{error}</div>}
                <button className="btn btn-primario rc-pagar" onClick={pagar} disabled={cargando}>
                  {cargando ? 'Procesando…' : 'Pagar y apartar'} {!cargando && <Flecha />}
                </button>
                <div className="rc-stripe">Pago seguro · Stripe</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CONFIRMACIÓN */}
      {vista === 'confirmacion' && comprobante && (
        <section className="vista activa">
          <div className="wrap seccion">
            <div className="conf">
              <div className="check">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F3EEE3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h2>Compra confirmada</h2>
              <p className="sub">Enviamos tu comprobante por correo. Presenta este pase (o indica tu asiento y nombre) al personal a bordo.</p>
              <div className="pase">
                <div className="pase-head"><div className="pase-head-row"><span className="tit">Comprobante de compra</span><span className="logo">Tren Restaurante</span></div></div>
                <span className="greca sm" />
                <div className="pase-body">
                  <div className="pase-folio"><div className="l">Folio</div><div className="c">{comprobante.folio}</div></div>
                  <div className="pase-grid">
                    <div className="campo-p"><div className="l">Pasajero</div><div className="v">{comprobante.nombre}</div></div>
                    <div className="campo-p"><div className="l">Asiento</div><div className="v mono">{comprobante.asiento}</div></div>
                    <div className="campo-p"><div className="l">Corrida</div><div className="v mono" style={{ fontSize: 15 }}>{comprobante.corridaCorta}</div></div>
                    <div className="campo-p"><div className="l">Sentido</div><div className="v" style={{ fontSize: 15 }}>{comprobante.sentido}</div></div>
                  </div>
                  <div className="pase-perf" />
                  <div className="pase-items">
                    {comprobante.items.map((it: any, i: number) => (
                      <div className="pi" key={i}><span className="n"><b>{it.grupo}</b>{it.nombre}</span><span className="q">{it.incluido ? 'Incluido' : '×' + it.cantidad}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="conf-acciones">
                <button className="btn btn-fantasma" onClick={() => { setCart({}); setCorridaId(null); setComprobante(null); setDatos({ nombre: '', asiento: '', telefono: '', email: '' }); ir('hero'); }}>Hacer otro pedido</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer>
        <span className="greca sm" style={{ opacity: .5 }} />
        <div className="wrap foot-in" style={{ marginTop: 26 }}>
          <span className="mono">TREN RESTAURANTE © 2026 · SERVICIO A BORDO</span>
          <span>Ruta Teya – Chichén Itzá</span>
        </div>
      </footer>
    </>
  );
}

function Tarjeta({ m, cant, cambiarCant, toggleIncluido }: {
  m: MenuItem; cant: number; cambiarCant: (id: string, d: number) => void; toggleIncluido: (id: string) => void;
}) {
  if (m.incluido) {
    const sel = cant > 0;
    return (
      <div className={`platillo incluido${sel ? ' activo' : ''}`}>
        <div className="plat-top"><div><div className="plat-op oro">Incluido</div><div className="plat-nombre">{m.nombre}</div></div><div className="plat-sincosto">Sin costo</div></div>
        <button className={`agregar toggle${sel ? ' sel' : ''}`} onClick={() => toggleIncluido(m.id)}>{sel ? '✓ Elegido' : 'Elegir'}</button>
      </div>
    );
  }
  const tag = m.vegano ? <span className="tag-veg">Vegano</span> : m.alcohol ? <span className="tag-alc">+18</span> : null;
  return (
    <div className={`platillo${cant > 0 ? ' activo' : ''}${m.principal ? ' principal' : ''}`}>
      <div className="plat-top"><div>{m.principal && <div className="plat-op">Plato principal</div>}<div className="plat-nombre">{m.nombre} {tag}</div></div><div className="plat-precio">${m.precio}</div></div>
      <div className="plat-desc">{m.descripcion || ''}</div>
      <div className="stepper">
        {cant === 0
          ? <button className="agregar" onClick={() => cambiarCant(m.id, 1)}>{m.principal ? 'Elegir' : 'Agregar'}</button>
          : <div className="controles" style={{ display: 'flex' }}>
              <button onClick={() => cambiarCant(m.id, -1)} aria-label="Quitar uno">−</button>
              <span className="cant">{cant}</span>
              <button onClick={() => cambiarCant(m.id, 1)} aria-label="Agregar uno">+</button>
            </div>}
      </div>
    </div>
  );
}
