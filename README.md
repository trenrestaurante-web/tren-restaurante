# Tren Restaurante — Preventa de comida a bordo (Tren Maya)

App tipo Cinépolis: el pasajero entra por un link, arma su preorden, la paga,
recibe un comprobante (folio), y la empresa ve en un panel cuánto preparar por corrida.

Stack: Next.js 15 + Supabase + Stripe + Resend. Deploy en Vercel.

## Arranque rapido (modo demo, sin configurar nada)

    npm install
    npm run dev

Abre http://localhost:3000 — la web funciona de una vez con datos de prueba.
El pago corre en MODO DEMO: genera el comprobante sin cobrar.

## Conectar los servicios reales

Copia `.env.example` a `.env.local` y llena las llaves.

### 1. Supabase (base de datos)
1. Crea un proyecto en supabase.com.
2. SQL Editor -> corre `supabase/schema.sql` y luego `supabase/seed.sql`.
3. Settings -> API -> copia URL, anon key y service_role key al `.env.local`.

### 2. Resend (correos) — opcional
Crea cuenta, verifica dominio, copia RESEND_API_KEY y pon CORREO_DE / CORREO_COCINA.
Si lo dejas vacio, la app NO truena, solo no manda correos.

### 3. Admin (panel de cocina)
Supabase -> Authentication -> Users -> crea 2-3 usuarios a mano.
Entra en /admin/login. NO hay registro publico (a proposito).

### 4. Stripe (cobro) — cuando estes listo
Mientras STRIPE_SECRET_KEY este vacio, corre en modo demo.
Al poner tus llaves, el cobro con Stripe Checkout se activa solo.
Webhook en Stripe -> https://TU-DOMINIO/api/webhook, evento checkout.session.completed.

## Estructura
    src/app/page.tsx          web publica (carga + flujo de compra)
    src/app/components/        LoadingScreen, OrderFlow
    src/app/confirmacion/      pase por folio (regreso de Stripe)
    src/app/admin/             login + panel de cocina (2 vistas + Excel)
    src/app/api/checkout/      crea orden / sesion de Stripe (demo + real)
    src/app/api/webhook/       Stripe confirma pago -> marca pagada + ticket
    src/lib/                   supabase, tipos, datos (fallback), correos
    supabase/schema.sql        tablas + RLS
    supabase/seed.sql          menu real + corridas

## Deploy a Vercel
1. Sube el repo a GitHub.
2. Importalo en Vercel, pega las variables de entorno.
3. Cambia NEXT_PUBLIC_URL a tu dominio y las llaves de Stripe a produccion.
