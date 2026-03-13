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
          <p
            className='font-mono text-large uppercase text-gold/50 shrink-0'
            style={{
              fontFamily: "'Pinyon Script', cursive",
              fontSize: '',
            }}
          >
            Fescue Club Champion
          </p>
          <div className='flex-1 h-px bg-gold/20' />
        </div>

        {/* Current champion — hero */}
        <div className='text-center mb-8'>
          <p className='font-mono text-label uppercase tracking-[0.25em] text-gold/60 mb-3'>
            {current.year}
          </p>
          <h2
            className='text-cream leading-none mb-3'
            style={{
              fontFamily: "'Pinyon Script', cursive",
              fontSize: 'clamp(2.4rem, 6vw, 3.6rem)',
            }}
          >
            {current.name}
          </h2>
          {current.tagline && (
            <p className='font-serif text-sm italic text-cream/40 font-light mt-2'>
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
  return (
    <div className='relative bg-white border border-cream-mid px-5 py-5 group hover:border-sand transition-colors'>
      {/* Corner ticks */}
      <span className='absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/25 pointer-events-none' />
      <span className='absolute top-0 right-0 w-3 h-3 border-t border-r border-gold/25 pointer-events-none' />
      <span className='absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold/25 pointer-events-none' />
      <span className='absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold/25 pointer-events-none' />

      {/* Watermark quail */}
      <div className='absolute bottom-3 right-4 opacity-[0.27] pointer-events-none select-none'>
        <Image src='/logo-badge.png' alt='' width={48} height={57} />
      </div>

      <p className='font-serif text-lg font-light text-navy group-hover:text-navy-dark transition-colors mb-3'>
        {member.full_name}
      </p>

      <div className='flex flex-col gap-1'>
        {member.phone && (
          <span className='font-mono text-label text-navy/40'>
            {member.phone}
          </span>
        )}
        {member.discord && (
          <span className='font-mono text-label text-navy/40'>
            {member.discord}
          </span>
        )}
        {!member.phone && !member.discord && (
          <span className='font-mono text-label text-navy/20'>
            No contact listed
          </span>
        )}
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
