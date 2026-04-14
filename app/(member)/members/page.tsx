import Link from 'next/link';
import Image from 'next/image';
import {
  getActiveMembers,
  getActiveMemberEmails,
  type DirectoryMember,
} from '@/lib/supabase/queries/members';
import { getAllChampions } from '@/lib/sanity/queries';
import type { ClubChampion } from '@/lib/sanity/types';
import { createClient } from '@/lib/supabase/server';
import { CopyEmailsButton } from '@/components/members/copy-emails-button';

export const metadata = {
  title: 'Members — Fescue',
};

export const dynamic = 'force-dynamic';

const CHAMPIONSHIP_ORDER = ['club', 'member_guest', 'member_member']
const CHAMPIONSHIP_LABELS: Record<string, string> = {
  club: 'Club Championship',
  member_guest: 'Member Guest',
  member_member: 'Member Member',
}

function ChampionPlaque({ champions }: { champions: ClubChampion[] }) {
  // Normalize: old records without championship default to 'club'
  const normalized = champions.map((c) => ({ ...c, championship: c.championship ?? 'club' }))

  // Group by year
  const byYear = normalized.reduce<Record<number, typeof normalized>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = []
    acc[c.year].push(c)
    return acc
  }, {})
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
  const currentYear = years[0]
  const currentChamps = byYear[currentYear]
  const pastYears = years.slice(1)

  // Group current year by championship
  const byChampionship = currentChamps.reduce<Record<string, typeof normalized>>((acc, c) => {
    const key = c.championship ?? 'club'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})
  const presentChampionships = CHAMPIONSHIP_ORDER.filter((k) => byChampionship[k])

  return (
    <div className='relative bg-navy overflow-hidden mb-14'>
      {/* Corner ticks */}
      <span className='absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/40' />
      <span className='absolute top-0 right-0 w-5 h-5 border-t border-r border-gold/40' />
      <span className='absolute bottom-0 left-0 w-5 h-5 border-b border-l border-gold/40' />
      <span className='absolute bottom-0 right-0 w-5 h-5 border-b border-r border-gold/40' />

      {/* Double scalloped frames */}
      <div className='frame-scalloped absolute inset-2 pointer-events-none' />
      <div className='frame-scalloped absolute inset-[10px] pointer-events-none' />

      <div className='relative px-10 py-10'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-8'>
          <div className='flex-1 h-px bg-gold/20' />
          <p className='font-mono text-label uppercase tracking-[0.3em] text-gold'>
            Fescue Club Champions
          </p>
          <div className='flex-1 h-px bg-gold/20' />
        </div>

        {/* Current year */}
        <p
          className='text-center text-gold mb-8'
          style={{ fontFamily: 'var(--font-pinyon), cursive', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}
        >
          {currentYear}
        </p>

        <div className='space-y-8'>
          {presentChampionships.map((champKey, i) => {
            const entries = byChampionship[champKey]
            const isClub = champKey === 'club'
            return (
              <div key={champKey}>
                {/* Championship name divider (skip for club if it's the only one) */}
                {(presentChampionships.length > 1) && (
                  <p className='text-center font-mono text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-5'>
                    {CHAMPIONSHIP_LABELS[champKey]}
                  </p>
                )}

                {isClub ? (
                  // Club Championship: Gross + Net side by side
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10'>
                    {(['gross', 'net'] as const).map((cat) => {
                      const champ = entries.find((c) => c.category === cat)
                      return (
                        <div key={cat} className='text-center'>
                          <p className='font-mono text-label uppercase tracking-[0.25em] text-gold/75 mb-3'>
                            {cat} champion
                          </p>
                          {champ ? (
                            <>
                              <h2
                                className='text-cream leading-none mb-2'
                                style={{ fontFamily: 'var(--font-pinyon), cursive', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
                              >
                                {champ.name}
                              </h2>
                              {champ.tagline && (
                                <p className='font-serif text-sm italic text-cream/60 font-light mt-1'>{champ.tagline}</p>
                              )}
                            </>
                          ) : (
                            <p className='font-serif italic text-cream/25 text-sm'>TBD</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Team events: centered winner name
                  <div className='text-center'>
                    {entries.map((champ) => (
                      <div key={champ.name}>
                        <h2
                          className='text-cream leading-none mb-2'
                          style={{ fontFamily: 'var(--font-pinyon), cursive', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}
                        >
                          {champ.name}
                        </h2>
                        {champ.tagline && (
                          <p className='font-serif text-sm italic text-cream/60 font-light mt-1'>{champ.tagline}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider between championships */}
                {i < presentChampionships.length - 1 && (
                  <div className='flex items-center gap-3 mt-8'>
                    <div className='flex-1 h-px bg-gold/15' />
                    <div className='w-1 h-1 rotate-45 bg-gold/30 shrink-0' />
                    <div className='flex-1 h-px bg-gold/15' />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Past years */}
        {pastYears.length > 0 && (
          <>
            <div className='flex items-center gap-3 my-8'>
              <div className='flex-1 h-px bg-gold/15' />
              <div className='w-1 h-1 rotate-45 bg-gold/30 shrink-0' />
              <div className='flex-1 h-px bg-gold/15' />
            </div>
            <div className='space-y-2 max-w-lg mx-auto'>
              <div className='grid grid-cols-[3rem_1fr_1fr_1fr] gap-x-4 mb-1'>
                <span />
                {(['club', 'member_guest', 'member_member'] as const).map((k) => (
                  <span key={k} className='font-mono text-gold/40 uppercase truncate' style={{ fontSize: '8px', letterSpacing: '0.2em' }}>
                    {k === 'club' ? 'Club' : k === 'member_guest' ? 'Mbr Guest' : 'Mbr Member'}
                  </span>
                ))}
              </div>
              {pastYears.map((year) => {
                const gross = byYear[year].find((c) => (c.championship ?? 'club') === 'club' && c.category === 'gross')
                const mg = byYear[year].find((c) => c.championship === 'member_guest')
                const mm = byYear[year].find((c) => c.championship === 'member_member')
                return (
                  <div key={year} className='grid grid-cols-[3rem_1fr_1fr_1fr] gap-x-4 items-baseline'>
                    <span className='font-mono text-gold/60 text-right' style={{ fontSize: '10px', letterSpacing: '0.08em' }}>{year}</span>
                    <span className='font-serif text-cream/60 text-xs font-light truncate'>{gross?.name ?? '—'}</span>
                    <span className='font-serif text-cream/60 text-xs font-light truncate'>{mg?.name ?? '—'}</span>
                    <span className='font-serif text-cream/60 text-xs font-light truncate'>{mm?.name ?? '—'}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div className='flex items-center gap-4 mt-8'>
          <div className='flex-1 h-px bg-gold/20' />
          <div className='w-1.5 h-1.5 rotate-45 bg-gold/40 shrink-0' />
          <div className='flex-1 h-px bg-gold/20' />
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: DirectoryMember }) {
  const joinYear =
    member.member_since ?? new Date(member.created_at).getFullYear();
  const yearLabel = `'${String(joinYear).slice(2)}`;

  return (
    <div className='relative bg-white border border-cream-mid px-6 py-5 group hover:border-sand/60 transition-colors overflow-hidden'>
      {/* Top row: name + member since */}
      <div className='flex items-baseline justify-between gap-4 mb-4'>
        <p className='font-serif text-2xl font-light text-navy group-hover:text-navy-dark transition-colors'>
          {member.full_name}
        </p>
        <span className='font-mono text-[9px] uppercase tracking-[0.22em] text-sand whitespace-nowrap shrink-0 select-none'>
          ◆ Member Since {yearLabel}
        </span>
      </div>

      {/* Divider */}
      <div className='flex items-center gap-2 mb-5'>
        <div className='flex-1 h-px bg-sand/35' />
        <div className='w-1 h-1 rotate-45 bg-sand/40 shrink-0' />
        <div className='flex-1 h-px bg-sand/35' />
      </div>

      {/* Contact + circular watermark */}
      <div className='flex items-end justify-between gap-4'>
        <div className='flex flex-col gap-1.5'>
          {member.phone && (
            <span className='font-serif text-base font-semibold text-navy'>
              {member.phone}
            </span>
          )}
          {member.discord && (
            <span className='font-mono text-[11px] tracking-[0.1em] text-navy-mid/60'>
              {member.discord}
            </span>
          )}
          {!member.phone && !member.discord && (
            <span className='font-serif italic text-label text-navy/25'>
              No contact listed
            </span>
          )}
        </div>

        {/* Watermark badge */}
        <div className='opacity-[0.27] pointer-events-none select-none shrink-0'>
          <Image src='/logo-badge.png' alt='' width={48} height={57} />
        </div>
      </div>
    </div>
  );
}

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentMember } = user
    ? await supabase.from('members').select('is_admin').eq('id', user.id).single()
    : { data: null }
  const isAdmin = currentMember?.is_admin === true

  const [members, champions, adminEmails] = await Promise.all([
    getActiveMembers(),
    getAllChampions(),
    isAdmin ? getActiveMemberEmails() : Promise.resolve([] as string[]),
  ]);

  return (
    <div>
      {/* Header */}
      <div className='mb-10'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-1'>
          Member Portal
        </p>
        <h1 className='font-serif text-2xl sm:text-display font-light text-navy'>
          Member Directory
        </h1>
        <div className='w-12 h-px bg-gold mt-4' />
      </div>

      {/* Champion plaque */}
      {champions.length > 0 && <ChampionPlaque champions={champions} />}

      {/* Directory */}
      <div className='flex items-center justify-between gap-4 mb-1'>
        <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/30'>
          {members.length} Active {members.length === 1 ? 'Member' : 'Members'}
        </p>
        {isAdmin && adminEmails.length > 0 && (
          <CopyEmailsButton emails={adminEmails} />
        )}
      </div>
      <p className='font-sans text-sm font-light text-navy/40 mb-6'>
        Contact info is set by each member in their{' '}
        <Link
          href='/account'
          className='text-gold hover:text-navy transition-colors underline underline-offset-2'
        >
          account settings
        </Link>
        .
      </p>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
