import { getPublicState, setManualStatus, Status, STATUSES } from '@/lib/status'

export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(getPublicState())
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!STATUSES.includes(body?.status)) {
    return Response.json({ message: 'Invalid status' }, { status: 400 })
  }
  await setManualStatus(body.status as Status)
  return Response.json(getPublicState())
}
