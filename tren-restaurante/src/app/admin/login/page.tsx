'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setError(''); setCargando(true);
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      router.push('/admin');
      router.refresh();
    } catch (e: any) {
      setError('Correo o contraseña incorrectos.');
    } finally { setCargando(false); }
  }

  return (
    <>
      <div className="franja" /><span className="greca" />
      <div className="wrap seccion" style={{ maxWidth: 440 }}>
        <div className="sec-head" style={{ textAlign: 'center', margin: '30px auto' }}>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>Panel de administración</span>
          <h2>Tren Restaurante</h2>
        </div>
        <div className="form-card">
          <div className="campo">
            <label>Correo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@trenrestaurante.com" />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') entrar(); }} />
          </div>
          {error && <div style={{ color: '#C0432A', fontSize: 13, marginBottom: 12, fontFamily: 'var(--mono)' }}>{error}</div>}
          <button className="btn btn-primario" style={{ width: '100%', justifyContent: 'center' }} onClick={entrar} disabled={cargando}>
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </div>
    </>
  );
}
