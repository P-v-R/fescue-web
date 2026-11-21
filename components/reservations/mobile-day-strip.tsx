'use client'

import { addDays, format, isSameDay, startOfDay } from 'date-fns'

type Props = {
  date: Date
  setDate: (d: Date) => void
  // 'yyyy-MM-dd' keys of days the member has an upcoming booking on
  bookedDates: Set<string>
}

const STRIP_DAYS = 7
const MAX_DAYS_AHEAD = 90

export function MobileDayStrip({ date, setDate, bookedDates }: Props) {
  const today = startOfDay(new Date())
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, i))
  const pickedOutsideStrip = !days.some((d) => isSameDay(d, date))

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-stretch gap-1'>
        {days.map((day) => {
          const selected = isSameDay(day, date)
          const booked = bookedDates.has(format(day, 'yyyy-MM-dd'))
          return (
            <button
              key={day.getTime()}
              type='button'
              onClick={() => setDate(day)}
              aria-pressed={selected}
              aria-label={`${format(day, 'EEEE, MMMM d')}${booked ? ', you have a booking' : ''}`}
              className={[
                'flex-1 min-w-0 h-14 flex flex-col items-center justify-center gap-px rounded-sm transition-colors',
                selected ? 'day-chip-selected bg-navy text-cream' : 'text-navy active:bg-navy/[0.07]',
              ].join(' ')}
            >
              <span className='font-mono text-[10px] uppercase tracking-[0.12em] opacity-80'>
                {format(day, 'EEE')}
              </span>
              <span className='font-serif text-lg leading-tight'>{format(day, 'd')}</span>
              <span
                aria-hidden='true'
                className={[
                  'w-1 h-1 rounded-full',
                  booked ? (selected ? 'bg-current' : 'bg-gold') : 'bg-transparent',
                ].join(' ')}
              />
            </button>
          )
        })}

        <div className='relative overflow-hidden shrink-0 w-10 h-14 flex items-center justify-center rounded-sm border border-sand/40 text-navy/55'>
          <svg width='18' height='18' viewBox='0 0 18 18' fill='none' aria-hidden='true'>
            <rect x='2.5' y='3.5' width='13' height='12' rx='1' stroke='currentColor' strokeWidth='1.3' />
            <path d='M2.5 7.5h13M6 1.8v3.2M12 1.8v3.2' stroke='currentColor' strokeWidth='1.3' strokeLinecap='round' />
          </svg>
          {/* Native picker sits invisibly over the icon so a tap opens the OS date sheet.
              iOS Safari gives date inputs a wide intrinsic min-width, so the box clips it
              and appearance-none drops the native sizing; otherwise the page widens. */}
          <input
            type='date'
            aria-label='Pick another date'
            value={format(date, 'yyyy-MM-dd')}
            min={format(today, 'yyyy-MM-dd')}
            max={format(addDays(today, MAX_DAYS_AHEAD), 'yyyy-MM-dd')}
            onChange={(e) => {
              if (!e.target.value) return
              const [y, m, d] = e.target.value.split('-').map(Number)
              setDate(new Date(y, m - 1, d))
            }}
            className='absolute inset-0 w-full h-full min-w-0 appearance-none opacity-0 cursor-pointer'
          />
        </div>
      </div>

      {pickedOutsideStrip && (
        <p className='font-serif italic text-base text-navy/65 px-0.5'>{format(date, 'EEEE, MMMM d')}</p>
      )}
    </div>
  )
}
