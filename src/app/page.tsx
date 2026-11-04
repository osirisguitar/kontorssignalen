'use client'
import { useCallback, useEffect, useState } from 'react'
import type { PublicState, Status } from '@/lib/status'

const BUTTONS: { status: Status; label: string; on: string; off: string }[] = [
  {
    status: 'red',
    label: 'UPPTAGEN',
    on: 'bg-red-500 shadow-lg shadow-red-500',
    off: 'bg-red-700',
  },
  {
    status: 'yellow',
    label: 'FOKUSERAR',
    on: 'bg-yellow-200 shadow-lg shadow-yellow-200',
    off: 'bg-yellow-400',
  },
  {
    status: 'green',
    label: 'VÄLKOMMEN IN',
    on: 'bg-green-400 shadow-lg shadow-green-400',
    off: 'bg-green-700',
  },
  {
    status: 'off',
    label: 'AV',
    on: 'bg-gray-400 shadow-lg shadow-gray-400',
    off: 'bg-gray-700',
  },
]

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })

export default function Home() {
  const [state, setState] = useState<PublicState | null>(null)
  const [connectError, setConnectError] = useState(false)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/status', { cache: 'no-store' })
    if (res.ok) setState(await res.json())
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('google')) {
      setConnectError(params.get('google') === 'error')
      window.history.replaceState(null, '', '/')
    }

    refresh()
    const interval = setInterval(refresh, 10_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const setStatus = async (status: Status) => {
    setState((s) => s && { ...s, status, meeting: null })
    const res = await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setState(await res.json())
  }

  const disconnect = async () => {
    const res = await fetch('/api/google/disconnect', { method: 'POST' })
    if (res.ok) setState(await res.json())
  }

  const current = state?.status

  return (
    <div
      style={{
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url("/office.png")',
      }}
      className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-cover'
    >
      <main className='flex flex-col gap-8 row-start-2 items-center'>
        <div className='w-[300px] h-[450px] flex flex-col gap-8 items-center m-auto bg-amber-900 p-10'>
          {BUTTONS.map((b) => (
            <div
              key={b.status}
              className={
                (current === b.status ? b.on : b.off) +
                ' flex flex-col items-center justify-center h-24 w-[90%] text-xl font-bold cursor-pointer'
              }
              onClick={() =>
                setStatus(
                  current === b.status && b.status !== 'off' ? 'off' : b.status,
                )
              }
            >
              {b.label}
            </div>
          ))}
        </div>

        {state?.google.configured && (
          <div className='w-[300px] bg-white/80 p-4 text-sm flex flex-col gap-2'>
            {state.meeting && (
              <div>
                I möte{state.meeting.summary && `: ${state.meeting.summary}`}{' '}
                (till {formatTime(state.meeting.end)})
              </div>
            )}
            {state.google.connected ? (
              <div className='flex justify-between items-center gap-2'>
                <span className='truncate'>
                  Kalender: {state.google.email ?? 'ansluten'}
                </span>
                <button className='underline shrink-0' onClick={disconnect}>
                  Koppla från
                </button>
              </div>
            ) : (
              <a className='underline' href='/api/google/connect'>
                Anslut Google Kalender
              </a>
            )}
            {(state.google.error || connectError) && (
              <div className='text-red-700'>
                {state.google.error ?? 'Anslutningen misslyckades'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
