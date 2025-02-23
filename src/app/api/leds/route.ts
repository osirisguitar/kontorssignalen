import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const ledName = request.nextUrl.searchParams.get('led')
  const state = request.nextUrl.searchParams.get('state')

  try {
    await fetch(`http://192.168.88.220/${ledName}${state}`)
  } catch {
    // ESP32 does not close connection properly
  }

  return Response.json({})
}
