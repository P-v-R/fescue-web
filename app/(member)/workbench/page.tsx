import { createClient } from '@/lib/supabase/server'
import type { WorkbenchPledge } from '@/lib/supabase/types'

export const metadata = {
  title: 'Workbench Fund — Fescue',
}

function ProgressBar({ total, goal }: { total: number; goal: number }) {
  const pct = Math.min(100, Math.round((total / goal) * 100))
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="font-serif text-2xl text-navy">${total.toLocaleString()}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/45">
          of ${goal.toLocaleString()} goal
        </span>
      </div>
      <div className="h-2 bg-cream-mid overflow-hidden">
        <div
          className="h-full bg-navy transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/45 mt-1.5">
        {pct}% funded
      </p>
    </div>
  )
}

export default async function WorkbenchPage() {
  const supabase = await createClient()

  const { data: pledges } = await supabase
    .from('workbench_pledges')
    .select('id, discord_user_id, discord_username, amount, note, created_at')
    .order('amount', { ascending: false })

  const rows = (pledges ?? []) as WorkbenchPledge[]
  const goal = parseInt(process.env.WORKBENCH_GOAL ?? '2500', 10)
  const total = rows.reduce((sum, p) => sum + p.amount, 0)
  const pledgeCount = rows.length

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-2">
          Club Initiative
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">
          Workbench Fund
        </h1>
        <p className="font-sans text-sm font-light text-navy/55 mt-3 leading-relaxed">
          Help us build out the perfect club workbench. Pledge via{' '}
          <span className="font-mono text-[12px]">/pledge</span> in the{' '}
          <span className="font-mono text-[12px]">#workbench-fund</span> Discord channel.
        </p>
      </div>

      <div className="bg-white border border-cream-mid px-6 py-6 mb-8">
        <ProgressBar total={total} goal={goal} />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40 mt-4">
          {pledgeCount} {pledgeCount === 1 ? 'member' : 'members'} pledged
        </p>
      </div>

      {rows.length > 0 && (
        <div>
          <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
            Pledge Board
          </p>
          <div className="bg-white border border-cream-mid divide-y divide-cream-mid">
            {rows.map((pledge, i) => (
              <div key={pledge.id} className="flex items-center gap-4 px-6 py-4">
                <span className="font-mono text-[10px] text-navy/30 w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-sans text-sm font-light text-navy">
                    {pledge.discord_username}
                  </span>
                  {pledge.note && (
                    <p className="font-sans text-xs font-light text-navy/40 italic truncate mt-0.5">
                      {pledge.note}
                    </p>
                  )}
                </div>
                <span className="font-mono text-sm text-navy shrink-0">
                  ${pledge.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
