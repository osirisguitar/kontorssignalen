import {
  applyStatus,
  getState,
  Meeting,
  savePersisted,
  setMeetings,
} from './status'

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events.readonly',
]

const SYNC_INTERVAL_MS = 2 * 60 * 1000
const TICK_INTERVAL_MS = 15 * 1000
const LOOKAHEAD_MS = 3 * 60 * 60 * 1000

const clientId = () => process.env.GOOGLE_CLIENT_ID ?? ''
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET ?? ''

export const getRedirectUri = (request: Request) => {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI
  const url = new URL(request.url)
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    url.host
  const proto =
    request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')
  return `${proto}://${host}/api/google/callback`
}

export const buildAuthUrl = (redirectUri: string, state: string) => {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

const tokenRequest = async (params: Record<string, string>) => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      ...params,
    }),
  })
  const body = await res.json()
  if (!res.ok) {
    throw new TokenError(body.error ?? `HTTP ${res.status}`)
  }
  return body as {
    access_token: string
    expires_in: number
    refresh_token?: string
    id_token?: string
  }
}

class TokenError extends Error {}

const emailFromIdToken = (idToken?: string) => {
  try {
    const payload = idToken!.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).email as
      string | undefined
  } catch {
    return undefined
  }
}

export const connect = async (code: string, redirectUri: string) => {
  const tokens = await tokenRequest({
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  if (!tokens.refresh_token) throw new Error('No refresh token received')
  const state = getState()
  state.persisted.google = {
    refreshToken: tokens.refresh_token,
    email: emailFromIdToken(tokens.id_token),
  }
  state.accessToken = {
    token: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  }
  state.syncError = undefined
  savePersisted()
  await syncCalendar()
}

export const disconnect = async () => {
  const state = getState()
  const refreshToken = state.persisted.google?.refreshToken
  state.persisted.google = undefined
  state.accessToken = undefined
  state.syncError = undefined
  savePersisted()
  setMeetings([])
  await applyStatus()
  if (refreshToken) {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`,
      { method: 'POST' },
    ).catch(() => {})
  }
}

const getAccessToken = async () => {
  const state = getState()
  if (state.accessToken && state.accessToken.expiresAt > Date.now() + 60_000) {
    return state.accessToken.token
  }
  const refreshToken = state.persisted.google?.refreshToken
  if (!refreshToken) return undefined
  const tokens = await tokenRequest({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  state.accessToken = {
    token: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  }
  return tokens.access_token
}

type CalendarEvent = {
  id: string
  status?: string
  summary?: string
  eventType?: string
  start?: { dateTime?: string }
  end?: { dateTime?: string }
  transparency?: string
  organizer?: { self?: boolean }
  attendees?: { self?: boolean; responseStatus?: string }[]
}

// Accepted invitations, plus events you created yourself (with or without
// guests). Events marked "Free" in Google never count.
const isBusyMeeting = (e: CalendarEvent) => {
  if (e.status === 'cancelled' || e.transparency === 'transparent') return false
  if ((e.eventType ?? 'default') !== 'default') return false
  if (!e.start?.dateTime || !e.end?.dateTime) return false // all-day
  const self = e.attendees?.find((a) => a.self)
  if (self) return self.responseStatus === 'accepted'
  return Boolean(e.organizer?.self)
}

const fetchAcceptedMeetings = async (token: string): Promise<Meeting[]> => {
  const now = Date.now()
  const params = new URLSearchParams({
    timeMin: new Date(now).toISOString(),
    timeMax: new Date(now + LOOKAHEAD_MS).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`Calendar API: HTTP ${res.status}`)
  const { items = [] } = (await res.json()) as { items?: CalendarEvent[] }

  return items.filter(isBusyMeeting).map((e) => ({
    id: e.id,
    summary: e.summary ?? '',
    start: Date.parse(e.start!.dateTime!),
    end: Date.parse(e.end!.dateTime!),
  }))
}

export const syncCalendar = async () => {
  const state = getState()
  if (!state.persisted.google) return
  try {
    const token = await getAccessToken()
    if (!token) return
    setMeetings(await fetchAcceptedMeetings(token))
    state.syncError = undefined
  } catch (err) {
    if (err instanceof TokenError && err.message === 'invalid_grant') {
      // Refresh token revoked or expired: require reconnect
      state.persisted.google = undefined
      state.accessToken = undefined
      savePersisted()
      setMeetings([])
      state.syncError = 'Åtkomsten har gått ut, anslut kalendern igen'
    } else {
      state.syncError = err instanceof Error ? err.message : String(err)
    }
    console.error('Calendar sync failed:', err)
  }
  await applyStatus()
}

export const startCalendarSync = () => {
  const g = globalThis as typeof globalThis & { __calendarSync?: boolean }
  if (g.__calendarSync) return
  g.__calendarSync = true

  applyStatus().then(syncCalendar)
  setInterval(syncCalendar, SYNC_INTERVAL_MS)
  // Meeting start/end is evaluated against cached events more often than
  // the calendar is fetched
  setInterval(applyStatus, TICK_INTERVAL_MS)
}
