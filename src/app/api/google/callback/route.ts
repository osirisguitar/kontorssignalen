import { connect, getRedirectUri } from '@/lib/google'

const redirectHome = (result: 'connected' | 'error') =>
  new Response(null, {
    status: 302,
    headers: {
      Location: `/?google=${result}`,
      'Set-Cookie': 'google_oauth_state=; Path=/api/google; Max-Age=0',
    },
  })

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)google_oauth_state=([^;]+)/)?.[1]

  if (!code || !state || state !== cookieState) return redirectHome('error')

  try {
    await connect(code, getRedirectUri(request))
    return redirectHome('connected')
  } catch (err) {
    console.error('Google connect failed:', err)
    return redirectHome('error')
  }
}
