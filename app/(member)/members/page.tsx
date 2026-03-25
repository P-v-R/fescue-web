import Link from 'next/link';
import Image from 'next/image';
import {
  getActiveMembers,
  type DirectoryMember,
} from '@/lib/supabase/queries/members';
import { getAllChampions } from '@/lib/sanity/queries';
import type { ClubChampion } from '@/lib/sanity/types';

export const metadata = {
  title: 'Members — Fescue',
};

export const dynamic = 'force-dynamic';

function ChampionPlaque({ champions }: { champions: ClubChampion[] }) {
  const current = champions[0];
  const past = champions.slice(1);

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
        {/* Header label */}
        <div className='flex items-center gap-4 mb-8'>
          <div className='flex-1 h-px bg-gold/20' />
          <p className='font-mono text-label uppercase tracking-[0.3em] text-gold'>
            Fescue Club Champion
          </p>
          <div className='flex-1 h-px bg-gold/20' />
        </div>

        {/* Current champion — hero */}
        <div className='text-center mb-8'>
          <p
            className='font-mono text-lg uppercase tracking-[0.25em] text-gold mb-3'
            style={{
              fontFamily: 'var(--font-pinyon), cursive',
              fontSize: '',
            }}
          >
            {current.year}
          </p>
          <h2
            className='text-cream leading-none mb-3'
            style={{
              fontFamily: 'var(--font-pinyon), cursive',
              fontSize: 'clamp(2.4rem, 6vw, 3.6rem)',
            }}
          >
            {current.name}
          </h2>
          {current.tagline && (
            <p className='font-serif text-lg italic text-cream/70 font-light mt-2'>
              {current.tagline}
            </p>
          )}
        </div>

        {/* Past champions */}
        {past.length > 0 && (
          <>
            <div className='flex items-center gap-3 mb-5'>
              <div className='flex-1 h-px bg-gold/15' />
              <div className='w-1 h-1 rotate-45 bg-gold/30 shrink-0' />
              <div className='flex-1 h-px bg-gold/15' />
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 max-w-lg mx-auto'>
              {past.map((c) => (
                <div key={c.year} className='flex items-baseline gap-2.5'>
                  <span
                    className='font-mono text-gold/35 shrink-0'
                    style={{ fontSize: '10px', letterSpacing: '0.08em' }}
                  >
                    {c.year}
                  </span>
                  <span className='font-serif text-cream/35 text-xs font-light truncate'>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer label */}
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
  const [members, champions] = await Promise.all([
    getActiveMembers(),
    getAllChampions(),
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
      <p className='font-mono text-label uppercase tracking-[0.2em] text-navy/30 mb-1'>
        {members.length} Active {members.length === 1 ? 'Member' : 'Members'}
      </p>
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
