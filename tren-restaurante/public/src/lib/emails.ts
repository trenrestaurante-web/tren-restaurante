import { Resend } from 'resend';

const KEY = process.env.RESEND_API_KEY;
const DE = process.env.CORREO_DE || 'Tren Restaurante <onboarding@resend.dev>';
const resend = KEY ? new Resend(KEY) : null;

interface ItemTicket { nombre: string; grupo: string; cantidad: number; incluido: boolean; }

interface DatosTicket {
  folio: string;
  nombre: string;
  asiento: string;
  email?: string | null;
  corrida: string;   // "13 SEP · Teya → Chichén · 08:00"
  total: number;
  items: ItemTicket[];
}

// --- Ticket / comprobante al cliente ---
export async function enviarTicketCliente(d: DatosTicket) {
  if (!resend || !d.email) return;   // sin llave o sin correo: no truena
  const filas = d.items.map(i =>
    `<tr>
       <td style="padding:6px 0;color:#221E16">${i.grupo} · ${i.nombre}</td>
       <td style="padding:6px 0;text-align:right;color:#6B6252">${i.incluido ? 'Incluido' : '×' + i.cantidad}</td>
     </tr>`).join('');

  await resend.emails.send({
    from: DE,
    to: d.email,
    subject: `Comprobante ${d.folio} · Tren Restaurante`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border:1px solid #E7DDC6;border-radius:8px;overflow:hidden">
      <div style="background:#0E3A31;color:#F4EEDF;padding:18px 24px">
        <div style="font-size:11px;letter-spacing:2px;color:#DDBE6E">COMPROBANTE DE COMPRA</div>
        <div style="font-size:18px;font-weight:bold">Tren Restaurante</div>
      </div>
      <div style="padding:24px;background:#F4EEDF">
        <div style="text-align:center;margin-bottom:18px">
          <div style="font-size:11px;letter-spacing:2px;color:#6B6252">FOLIO</div>
          <div style="font-size:30px;font-weight:bold;letter-spacing:3px;color:#0E3A31">${d.folio}</div>
        </div>
        <p style="margin:4px 0;color:#221E16"><b>Pasajero:</b> ${d.nombre}</p>
        <p style="margin:4px 0;color:#221E16"><b>Asiento:</b> ${d.asiento}</p>
        <p style="margin:4px 0 16px;color:#221E16"><b>Corrida:</b> ${d.corrida}</p>
        <table style="width:100%;border-top:2px dashed #E7DDC6;border-collapse:collapse">${filas}</table>
        <p style="text-align:right;margin-top:16px;font-size:18px;color:#0E3A31"><b>Total pagado: $${d.total.toLocaleString('es-MX')} MXN</b></p>
        <p style="font-size:12px;color:#6B6252;margin-top:16px">Presenta este comprobante (o indica tu asiento y nombre) al personal a bordo.</p>
      </div>
    </div>`,
  });
}

interface ItemResumen { grupo: string; nombre: string; cantidad: number; }

// --- Lista consolidada a cocina (al cerrar la corrida) ---
export async function enviarListaCocina(corrida: string, resumen: ItemResumen[]) {
  const cocina = process.env.CORREO_COCINA;
  if (!resend || !cocina) return;
  const filas = resumen.map(r =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${r.grupo} · ${r.nombre}</td>
         <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${r.cantidad}</td></tr>`).join('');

  await resend.emails.send({
    from: DE,
    to: cocina,
    subject: `Producción para ${corrida} · Tren Restaurante`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#0E3A31">Resumen de producción — ${corrida}</h2>
      <p style="color:#555">Cantidades totales a preparar para esta corrida:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th style="text-align:left;padding:6px 12px;border-bottom:2px solid #0E3A31">Platillo</th>
        <th style="text-align:right;padding:6px 12px;border-bottom:2px solid #0E3A31">Cantidad</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`,
  });
}
