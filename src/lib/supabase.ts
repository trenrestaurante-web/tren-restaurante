import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigurado = Boolean(url && anon);

// Cliente público (lectura de corridas y menú)
export function supabasePublico() {
  if (!url || !anon) return null;
  return createClient(url, anon);
}

// Cliente de servidor (service role) — SOLO en el servidor.
// Se salta RLS: con este se crean las órdenes tras confirmar el pago.
export function supabaseServidor() {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}
