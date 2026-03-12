'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Member } from '@/lib/supabase/types'

export function MembersClient({ members }: { members: Member[] }) {
  const [query, setQuery] = useState('')

  const filtered = members.filter((m) => {
    const q = query.toLowerCase()
    return m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="mb-5">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-80 bg-white border border-cream-mid px-4 py-2.5 font-mono text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <p className="font-mono text-label text-navy/40 mb-3 uppercase tracking-[0.15em]">
        {filtered.length} {filtered.length === 1 ? 'member' : 'members'}
      </p>

      <div className="flex flex-col gap-1">
        {filtered.map((member) => (
          <Link
            key={member.id}
            href={`/admin/members/${member.id}`}
            className="bg-white border border-cream-mid px-5 py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_220px_120px_auto] items-center gap-x-6 hover:border-gold/40 transition-colors group"
          >
            <div>
              <p className="font-serif text-lg font-light text-navy group-hover:text-navy">{member.full_name}</p>
              <p className="font-mono text-label text-navy/45">{member.email}</p>
            </div>

            <p className="hidden sm:block font-mono text-label text-navy/40">
              Since {format(new Date(member.created_at), 'MMM yyyy')}
            </p>

            <div className="hidden sm:flex gap-1.5">
              {!member.is_active && (
                <span className="font-mono text-label uppercase tracking-[0.12em] text-red-400 bg-red-50 px-2 py-0.5">
                  Inactive
                </span>
              )}
              {member.is_admin && (
                <span className="font-mono text-label uppercase tracking-[0.12em] text-gold bg-gold/10 px-2 py-0.5">
                  Admin
                </span>
              )}
              {member.is_active && !member.is_admin && (
                <span className="font-mono text-label uppercase tracking-[0.12em] text-sage bg-sage/10 px-2 py-0.5">
                  Active
                </span>
              )}
            </div>

            <span className="font-mono text-label text-navy/30 group-hover:text-gold transition-colors">→</span>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="font-serif italic text-label text-sand">No members match your search.</p>
        )}
      </div>
    </div>
  )
}
