# JadrDevX

Panel de gestión y análisis para X, desarrollado por JadrDev.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth, Postgres y Edge Functions)
- X API v2 desde el backend

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

Completa `.env` con la URL y la clave pública (anon/publishable) de tu proyecto Supabase. No añadas secretos de X ni la service role key al frontend.

## Backend Supabase

La migración inicial crea `public.x_posts`, con Row Level Security para que cada usuario autenticado solo pueda consultar su propio historial.

1. Instala y autentica Supabase CLI.
2. Enlaza el proyecto: `supabase link --project-ref TU_PROJECT_REF`.
3. Aplica la migración: `supabase db push`.
4. Configura los secretos de la Edge Function:

```bash
supabase secrets set X_CONSUMER_KEY=... X_CONSUMER_SECRET=... X_ACCESS_TOKEN=... X_ACCESS_TOKEN_SECRET=...
```

5. Despliega la función: `supabase functions deploy x-api`.

La función exige un JWT de Supabase y realiza las llamadas a X desde el servidor mediante OAuth 1.0a. Las credenciales nunca deben incluirse en variables `VITE_*`, código cliente ni en Git.

## Acciones de la Edge Function

Invocación POST a `/functions/v1/x-api` con el JWT del usuario:

- `{ "action": "me" }`: consulta el perfil de la cuenta X configurada en los secrets.
- `{ "action": "publish", "text": "..." }`: publica el texto y registra el identificador en `x_posts`.

## Alcance actual

Este primer backend usa una cuenta X configurada en los secrets del proyecto Supabase. Todavía no incluye el flujo OAuth para que varios usuarios conecten sus propias cuentas, ni programación automática de publicaciones. La interfaz se conectará a estas funciones en el siguiente hito.

Las llamadas reales requieren un proyecto Supabase, secrets válidos de X y permisos/tier de API compatibles con los endpoints utilizados.
