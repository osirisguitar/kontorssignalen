'use client'
import { useState } from 'react'

export default function Home() {
  const [green, setGreen] = useState(false)
  const [red, setRed] = useState(false)
  const [yellow, setYellow] = useState(false)

  const setLed = async (ledName: string, state: boolean) => {
    await fetch(`/api/leds?led=${ledName}&state=${state ? 'on' : 'off'}`)
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
              (red ? 'bg-red-500 shadow-lg shadow-red-500' : 'bg-red-700') +
              ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
            }
            onClick={() => {
              setRed(!red)
              setLed('red', !red)
            }}
          >
            UPPTAGEN
          </div>
          <div
            className={
              (yellow
                ? 'bg-yellow-200 shadow-lg shadow-yellow-200'
                : 'bg-yellow-400') +
              ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
            }
            onClick={() => {
              setYellow(!yellow)
              setLed('yellow', !yellow)
            }}
          >
            FOKUSERAR
          </div>
          <div
            className={
              (green
                ? 'bg-green-400 shadow-lg shadow-green-400'
                : 'bg-green-700') +
              ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
            }
            onClick={() => {
              setGreen(!green)
              setLed('green', !green)
            }}
          >
            VÄLKOMMEN IN
          </div>
        </div>
      </main>
    </div>
  )
}
