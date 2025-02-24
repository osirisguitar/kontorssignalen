type LedStates = Record<string, boolean>

const createLedsString = (ledStates: LedStates) => {
  const ledString = `${ledStates.red ? '1' : '0'}${
    ledStates.yellow ? '1' : '0'
  }${ledStates.green ? '1' : '0'}`
  return ledString
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body) {
    return Response.json({ message: 'No content provided' }, { status: 400 })
  }

  const ledStates = body

  try {
    await fetch(`http://192.168.88.220/leds/${createLedsString(ledStates)}`)
  } catch {
    // ESP32 does not close connection properly
  }

  return Response.json({})
}
