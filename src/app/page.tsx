'use client'
import { useState } from 'react'

type LedStates = Record<string, boolean>

export default function Home() {
  const [leds, setLeds] = useState<LedStates>({
    red: false,
    yellow: false,
    green: false,
  })

  const updateLeds = async (red: boolean, yellow: boolean, green: boolean) => {
    const updatedLeds = {
      red,
      yellow,
      green,
    }
    setLeds(updatedLeds)

    sendLedStates(updatedLeds)
  }

  const sendLedStates = async (ledStates: LedStates) => {
    await fetch(`/api/leds`, {
      method: 'POST',
      body: JSON.stringify(ledStates),
    })
  }

  return (
    <div
      style={{
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url("/office.png")',
      }}
      className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-cover'
    >
      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <div className='w-[300px] h-[450px] flex flex-col gap-8 items-center m-auto bg-amber-900 p-10'>
          <div
            className={
              (leds.red
                ? 'bg-red-500 shadow-lg shadow-red-500'
                : 'bg-red-700') +
              ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
            }
            onClick={() => {
              if (!leds.red) {
                updateLeds(true, false, false)
              } else {
                updateLeds(false, false, false)
              }
            }}
          >
            UPPTAGEN
          </div>
          <div
            className={
              (leds.yellow
                ? 'bg-yellow-200 shadow-lg shadow-yellow-200'
                : 'bg-yellow-400') +
              ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
            }
            onClick={() => {
              if (!leds.yellow) {
                updateLeds(false, true, false)
              } else {
                updateLeds(false, false, false)
              }
            }}
          >
            FOKUSERAR
          </div>
          <div
            className={
              (leds.green
                ? 'bg-green-400 shadow-lg shadow-green-400'
                : 'bg-green-700') +
              ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
            }
            onClick={() => {
              if (!leds.green) {
                updateLeds(false, false, true)
              } else {
                updateLeds(false, false, false)
              }
            }}
          >
            VÄLKOMMEN IN
          </div>
          <div
            className={
              (!leds.red && !leds.yellow && !leds.green
                ? 'bg-gray-400 shadow-lg shadow-gray-400'
                : 'bg-gray-700') +
              ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
            }
            onClick={() => {
              updateLeds(false, false, false)
            }}
          >
            AV
          </div>
        </div>
      </main>
    </div>
  )
}
