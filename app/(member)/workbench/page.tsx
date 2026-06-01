import { createClient } from '@/lib/supabase/server'
import type { WorkbenchPledge } from '@/lib/supabase/types'

export const metadata = {
  title: 'Workbench Fund — Fescue',
}

const GOAL = parseInt(process.env.WORKBENCH_GOAL ?? '2500', 10)

const EQUIPMENT = [
  'Loft / Lie Machine',
  'Bench Vise',
  'Club Ruler',
  'Iron Bend Machine',
  'Grip Station',
  'Sand and Cut Station',
  'Dedicated Workbench and Portable Bench',
] as const

const CAPABILITIES = [
  'Loft and lie adjustments',
  'Regripping',
  'Shaft installation and removal',
  'Swing weight measurement and tuning',
  'General club repair and maintenance',
  'Club experimentation, tinkering, and education',
] as const

const OPERATIONS = [
  'Shared club resource available to all members',
  'Usage guidelines established prior to launch',
  'Certain procedures may require experienced assistance',
  'Safety and liability addressed before use',
  'Tools organized, maintained, and stored on-site',
] as const

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

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-1.5 w-1 h-1 rounded-full bg-navy/25 shrink-0" />
          <span className="font-sans text-sm font-light text-navy/70">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default async function WorkbenchPage() {
  const supabase = await createClient()

  const { data: pledges } = await supabase
    .from('workbench_pledges')
    .select('id, discord_username, amount, note, created_at')
    .order('amount', { ascending: false })
    .limit(200)

  const rows = (pledges ?? []) as WorkbenchPledge[]
  const total = rows.reduce((sum, p) => sum + p.amount, 0)
  const pledgeCount = rows.length

  return (
    <div className="max-w-2xl space-y-12">

      {/* Header */}
      <div>
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-2">
          Club Initiative
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">
          Workbench Fund
        </h1>
        <p className="font-sans text-sm font-light text-navy/55 mt-3 leading-relaxed max-w-prose">
          The Fescue Workbench will provide a dedicated space for members to build, repair, and
          customize their golf clubs — a place for experimentation, education, collaboration, and
          hands-on enjoyment of the game.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-cream-mid px-6 py-6">
        <ProgressBar total={total} goal={GOAL} />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40 mt-4">
          {pledgeCount} {pledgeCount === 1 ? 'member' : 'members'} pledged
        </p>
      </div>

      {/* Equipment + Capabilities */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-cream-mid px-6 py-6">
          <h2 className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
            Equipment
          </h2>
          <BulletList items={EQUIPMENT} />
        </div>
        <div className="bg-white border border-cream-mid px-6 py-6">
          <h2 className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
            Capabilities
          </h2>
          <BulletList items={CAPABILITIES} />
        </div>
      </div>

      {/* Budget + Operations */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-cream-mid px-6 py-6">
          <h2 className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-4">
            Budget
          </h2>
          <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
            The fundraising goal reflects the estimated cost of acquiring the equipment and
            supplies for a functional workshop. Should contributions exceed the goal, additional
            funds may expand tooling, increase consumable inventory, or acquire further equipment.
          </p>
        </div>
        <div className="bg-white border border-cream-mid px-6 py-6">
          <h2 className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-4">
            Operations
          </h2>
          <BulletList items={OPERATIONS} />
        </div>
      </div>

      {/* Pledge board */}
      {rows.length > 0 && (
        <div>
          <h2 className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
            Pledge Board
          </h2>
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

      {/* How to pledge + important note */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-cream-mid px-6 py-6">
          <h2 className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-4">
            How to Pledge
          </h2>
          <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
            Use{' '}
            <span className="font-mono text-[12px] text-navy">/pledge</span> on the club Discord
            to add your pledge. Use{' '}
            <span className="font-mono text-[12px] text-navy">/workbench</span> to check the
            current total and leaderboard at any time.
          </p>
        </div>
        <div className="bg-white border border-cream-mid px-6 py-6">
          <h2 className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-4">
            Important Note
          </h2>
          <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
            A pledge is an expression of interest and support — no payment is required at the
            time of pledging. The goal is to track progress transparently and determine whether
            sufficient support exists to move forward.
          </p>
        </div>
      </div>

      {/* Footer message */}
      <p className="font-sans text-sm font-light text-navy/45 leading-relaxed pb-4 border-t border-cream-mid pt-6">
        Our goal is to build something valuable for the membership — a resource that allows
        Fescue members to learn, experiment, and take a more hands-on approach to their
        equipment. Thank you to everyone who helps make projects like this possible.
      </p>

    </div>
  )
}
