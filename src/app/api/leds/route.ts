import { getPublicState, setManualStatus } from '@/lib/status'

// Legacy endpoint: accepts { red, yellow, green } booleans
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ message: 'No content provided' }, { status: 400 })
  }
  const status = body.red
    ? 'red'
    : body.yellow
      ? 'yellow'
      : body.green
        ? 'green'
        : 'off'
  await setManualStatus(status)
  return Response.json(getPublicState())
}
