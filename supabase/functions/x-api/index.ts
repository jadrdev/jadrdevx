import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function encode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    '%' + char.charCodeAt(0).toString(16).toUpperCase(),
  )
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function createOAuthHeader(method: string, url: string) {
  const consumerKey = Deno.env.get('X_CONSUMER_KEY')
  const consumerSecret = Deno.env.get('X_CONSUMER_SECRET')
  const accessToken = Deno.env.get('X_ACCESS_TOKEN')
  const accessTokenSecret = Deno.env.get('X_ACCESS_TOKEN_SECRET')

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error('Faltan secrets de X en Supabase.')
  }

  const parameters: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomUUID().replaceAll('-', ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  const parameterString = Object.entries(parameters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => encode(key) + '=' + encode(value))
    .join('&')

  const baseString = [
    method.toUpperCase(),
    encode(url),
    encode(parameterString),
  ].join('&')

  const signingKey = encode(consumerSecret) + '&' + encode(accessTokenSecret)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(baseString),
  )
  parameters.oauth_signature = toBase64(new Uint8Array(signature))

  return 'OAuth ' + Object.entries(parameters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => encode(key) + '="' + encode(value) + '"')
    .join(', ')
}

async function callX(method: string, url: string, body?: unknown) {
  const authorization = await createOAuthHeader(method, url)
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authorization,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('X API error', response.status, payload)
    throw new Error('X API ha rechazado la solicitud (' + response.status + ').')
  }
  return payload
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return json({ error: 'Sesión no válida.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Falta configuración de Supabase.' }, 500)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) return json({ error: 'No autorizado.' }, 401)

  let input: { action?: string; text?: string }
  try {
    input = await request.json()
  } catch {
    return json({ error: 'El cuerpo debe ser JSON válido.' }, 400)
  }

  try {
    if (input.action === 'me') {
      const profile = await callX('GET', 'https://api.x.com/2/users/me?user.fields=profile_image_url,public_metrics')
      return json({ data: profile.data })
    }

    if (input.action === 'publish') {
      const content = input.text?.trim()
      if (!content) return json({ error: 'El texto de la publicación está vacío.' }, 400)
      if (content.length > 10000) return json({ error: 'El texto supera el límite permitido.' }, 400)

      const result = await callX('POST', 'https://api.x.com/2/tweets', { text: content })
      const postId = result?.data?.id
      if (!postId) return json({ error: 'X no devolvió el identificador de la publicación.' }, 502)

      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { error: insertError } = await admin.from('x_posts').insert({
        user_id: user.id,
        x_post_id: postId,
        content,
      })
      if (insertError) {
        console.error('Post published but history insert failed', insertError)
        return json({ data: { id: postId }, warning: 'Publicado en X, pero no se pudo guardar el historial.' }, 200)
      }
      return json({ data: { id: postId, text: content } }, 201)
    }

    return json({ error: 'Acción no reconocida.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado.'
    return json({ error: message }, 502)
  }
})
