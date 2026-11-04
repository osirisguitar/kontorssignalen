import { randomBytes } from 'node:crypto'
import { buildAuthUrl, getRedirectUri } from '@/lib/google'

export function GET(request: Request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.json(
      { message: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set' },
      { status: 500 },
    )
  }
  const state = randomBytes(16).toString('hex')
  return new Response(null, {
    status: 302,
    headers: {
      Location: buildAuthUrl(getRedirectUri(request), state),
      'Set-Cookie': `google_oauth_state=${state}; Path=/api/google; HttpOnly; SameSite=Lax; Max-Age=600`,
    },
  })
}
