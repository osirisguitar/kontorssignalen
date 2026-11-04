import { disconnect } from '@/lib/google'
import { getPublicState } from '@/lib/status'

export async function POST() {
  await disconnect()
  return Response.json(getPublicState())
}
