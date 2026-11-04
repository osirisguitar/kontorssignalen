import fs from 'node:fs'
import path from 'node:path'

export type Status = 'red' | 'yellow' | 'green' | 'off'
export const STATUSES: Status[] = ['red', 'yellow', 'green', 'off']

export type Meeting = {
  id: string
  summary: string
  start: number
  end: number
}

type PersistedState = {
  manualStatus: Status
  google?: { refreshToken: string; email?: string }
  // Meetings where the user manually changed status while it was ongoing
  dismissedMeetingIds: string[]
}

type RuntimeState = {
  persisted: PersistedState
  meetings: Meeting[]
  lastSentStatus?: Status
  accessToken?: { token: string; expiresAt: number }
  syncError?: string
}

const LED_HOST = process.env.LED_HOST ?? '192.168.88.220'
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data')
const STATE_FILE = path.join(DATA_DIR, 'state.json')

const loadPersisted = (): PersistedState => {
  const defaults: PersistedState = {
    manualStatus: 'off',
    dismissedMeetingIds: [],
  }
  try {
    return {
      ...defaults,
      ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')),
    }
  } catch {
    return defaults
  }
}

// Stored on globalThis since route handlers and instrumentation may be
// bundled separately but run in the same process.
const g = globalThis as typeof globalThis & {
  __kontorssignalen?: RuntimeState
}

export const getState = (): RuntimeState => {
  if (!g.__kontorssignalen) {
    g.__kontorssignalen = { persisted: loadPersisted(), meetings: [] }
  }
  return g.__kontorssignalen
}

export const savePersisted = () => {
  const state = getState()
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = `${STATE_FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(state.persisted, null, 2), {
    mode: 0o600,
  })
  fs.renameSync(tmp, STATE_FILE)
}

export const getCurrentMeeting = (now = Date.now()): Meeting | undefined => {
  const { meetings, persisted } = getState()
  return meetings.find(
    (m) =>
      m.start <= now &&
      now < m.end &&
      !persisted.dismissedMeetingIds.includes(m.id),
  )
}

export const getEffectiveStatus = (): Status =>
  getCurrentMeeting() ? 'red' : getState().persisted.manualStatus

const ledString = (status: Status) =>
  `${status === 'red' ? 1 : 0}${status === 'yellow' ? 1 : 0}${
    status === 'green' ? 1 : 0
  }`

const sendToLeds = async (status: Status) => {
  try {
    await fetch(`http://${LED_HOST}/leds/${ledString(status)}`, {
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // ESP32 does not close connection properly
  }
}

// Pushes the effective status to the LEDs if it has changed
export const applyStatus = async () => {
  const state = getState()
  const status = getEffectiveStatus()
  if (status === state.lastSentStatus) return
  state.lastSentStatus = status
  await sendToLeds(status)
}

export const setManualStatus = async (status: Status) => {
  const state = getState()
  // Manual change during a meeting overrides the meeting until it ends
  const meeting = getCurrentMeeting()
  if (meeting) state.persisted.dismissedMeetingIds.push(meeting.id)
  state.persisted.manualStatus = status
  savePersisted()
  // Always send on manual change, so a button press can resync the LEDs
  state.lastSentStatus = undefined
  await applyStatus()
}

export const setMeetings = (meetings: Meeting[]) => {
  const state = getState()
  state.meetings = meetings
  const ids = new Set(meetings.map((m) => m.id))
  const dismissed = state.persisted.dismissedMeetingIds.filter((id) =>
    ids.has(id),
  )
  if (dismissed.length !== state.persisted.dismissedMeetingIds.length) {
    state.persisted.dismissedMeetingIds = dismissed
    savePersisted()
  }
}

export const getPublicState = () => {
  const state = getState()
  const meeting = getCurrentMeeting()
  return {
    status: getEffectiveStatus(),
    manualStatus: state.persisted.manualStatus,
    meeting: meeting ? { summary: meeting.summary, end: meeting.end } : null,
    google: {
      configured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      connected: Boolean(state.persisted.google),
      email: state.persisted.google?.email ?? null,
      error: state.syncError ?? null,
    },
  }
}

export type PublicState = ReturnType<typeof getPublicState>
