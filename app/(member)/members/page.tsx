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

function GoldRule({ diamond = false }: { diamond?: boolean }) {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex-1 h-px bg-gold/25' />
      {diamond && <div className='w-1.5 h-1.5 rotate-45 bg-gold/50 shrink-0' />}
      <div className='flex-1 h-px bg-gold/25' />
    </div>
  )
}

function ChampionPlaque({ champions }: { champions: ClubChampion[] }) {
  const normalized = champions.map((c) => ({ ...c, championship: c.championship ?? 'club' }))

  const byYear = normalized.reduce<Record<number, typeof normalized>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = []
    acc[c.year].push(c)
    return acc
  }, {})
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
  const currentYear = years[0]
  const currentChamps = byYear[currentYear]
  const pastYears = years.slice(1)

  const byChampionship = currentChamps.reduce<Record<string, typeof normalized>>((acc, c) => {
    const key = c.championship ?? 'club'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})
  const presentChampionships = CHAMPIONSHIP_ORDER.filter((k) => byChampionship[k])

  return (
    <div className='relative bg-navy overflow-hidden mb-14'
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,210,100,0.04) 0%, transparent 70%)',
      }}
    >
      {/* Corner ornaments */}
      <span className='absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-gold/35' />
      <span className='absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-gold/35' />
      <span className='absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-gold/35' />
      <span className='absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-gold/35' />
      <div className='frame-scalloped absolute inset-2 pointer-events-none' />
      <div className='frame-scalloped absolute inset-[10px] pointer-events-none' />

      <div className='relative px-8 sm:px-14 py-12'>

        {/* ── Header ── */}
        <div className='flex items-center gap-4 mb-10'>
          <div className='flex-1 h-px bg-gold/25' />
          <p className='font-mono text-[10px] uppercase tracking-[0.35em] text-gold px-2'>
            Fescue Club Champions
          </p>
          <div className='flex-1 h-px bg-gold/25' />
        </div>

        {/* ── Current year — centerpiece plaque ── */}
        <div className='text-center mb-10'>
          <p
            className='text-gold/90 leading-none'
            style={{ fontFamily: 'var(--font-pinyon), cursive', fontSize: 'clamp(2.8rem, 7vw, 4.5rem)' }}
          >
            {currentYear}
          </p>
        </div>

        <div className='space-y-10'>
          {presentChampionships.map((champKey, i) => {
            const entries = byChampionship[champKey]
            const isClub = champKey === 'club'

            return (
              <div key={champKey}>
                {/* Championship label */}
                <div className='flex items-center gap-4 mb-7'>
                  <div className='flex-1 h-px bg-gold/15' />
                  <p className='font-mono text-[10px] uppercase tracking-[0.3em] text-gold/55 px-1'>
                    {CHAMPIONSHIP_LABELS[champKey]}
                  </p>
                  <div className='flex-1 h-px bg-gold/15' />
                </div>

                {isClub ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12'>
                    {(['gross', 'net'] as const).map((cat) => {
                      const champ = entries.find((c) => c.category === cat)
                      return (
                        <div key={cat} className='text-center'>
                          <p className='font-mono text-[10px] uppercase tracking-[0.28em] text-gold/60 mb-4'>
                            {cat} Champion
                          </p>
                          {champ ? (
                            <>
                              <h2
                                className='text-cream leading-[1.1]'
                                style={{ fontFamily: 'var(--font-pinyon), cursive', fontSize: 'clamp(2.4rem, 5.5vw, 3.6rem)' }}
                              >
                                {champ.name}
                              </h2>
                              {champ.tagline && (
                                <p className='font-serif text-xs italic text-cream/45 font-light mt-2 tracking-wide'>
                                  {champ.tagline}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className='font-serif italic text-cream/20 text-sm'>TBD</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className='text-center'>
                    {entries.map((champ) => (
                      <div key={champ.name} className='mb-2 last:mb-0'>
                        <h2
                          className='text-cream leading-[1.15] px-4'
                          style={{ fontFamily: 'var(--font-pinyon), cursive', fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}
                        >
                          {champ.name}
                        </h2>
                        {champ.tagline && (
                          <p className='font-serif text-xs italic text-cream/45 font-light mt-2 tracking-wide'>
                            {champ.tagline}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {i < presentChampionships.length - 1 && (
                  <div className='mt-10'>
                    <GoldRule diamond />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Past years — honor roll ── */}
        {pastYears.length > 0 && (
          <>
            <div className='my-10'>
              <GoldRule diamond />
            </div>

            {/* Section label */}
            <p className='text-center font-mono text-[10px] uppercase tracking-[0.3em] text-gold/40 mb-8'>
              Past Champions
            </p>

            <div className='space-y-0 max-w-2xl mx-auto'>
              {pastYears.map((year) => {
                const gross = byYear[year].find((c) => (c.championship ?? 'club') === 'club' && c.category === 'gross')
                const mg = byYear[year].find((c) => c.championship === 'member_guest')
                const mm = byYear[year].find((c) => c.championship === 'member_member')
                const hasTeamEvents = mg || mm

                return (
                  <div key={year} className='border-b border-gold/10 last:border-0 py-4 first:pt-0'>
                    {/* Year */}
                    <span
                      className='block text-center text-gold/50 mb-3 leading-none'
                      style={{ fontFamily: 'var(--font-pinyon), cursive', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)' }}
                    >
                      {year}
                    </span>

                    {hasTeamEvents ? (
                      /* Multi-event year: stack each event */
                      <div className='space-y-2'>
                        {gross && (
                          <div className='flex items-baseline gap-3 justify-center flex-wrap'>
                            <span className='font-mono text-[9px] uppercase tracking-[0.2em] text-gold/35 shrink-0'>Club</span>
                            <span className='font-serif text-sm font-light text-cream/65 text-center'>{gross.name}</span>
                          </div>
                        )}
                        {mg && (
                          <div className='flex items-baseline gap-3 justify-center flex-wrap'>
                            <span className='font-mono text-[9px] uppercase tracking-[0.2em] text-gold/35 shrink-0 whitespace-nowrap'>Mbr–Guest</span>
                            <span className='font-serif text-sm font-light text-cream/65 text-center'>{mg.name}</span>
                          </div>
                        )}
                        {mm && (
                          <div className='flex items-baseline gap-3 justify-center flex-wrap'>
                            <span className='font-mono text-[9px] uppercase tracking-[0.2em] text-gold/35 shrink-0 whitespace-nowrap'>Mbr–Mbr</span>
                            <span className='font-serif text-sm font-light text-cream/65 text-center'>{mm.name}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Club-only year: single centered name */
                      <p className='font-serif text-sm font-light text-cream/65 text-center'>
                        {gross?.name ?? '—'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Footer rule */}
        <div className='mt-10'>
          <GoldRule diamond />
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
