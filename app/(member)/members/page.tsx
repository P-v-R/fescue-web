import Link from 'next/link';
import { getActiveMembers } from '@/lib/supabase/queries/members';

export const metadata = {
  title: 'Members — Fescue',
};

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const members = await getActiveMembers();

  return (
    <div className='max-w-3xl'>
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

      <p className='font-sans text-sm font-light text-navy/50 mb-8'>
        {members.length} active {members.length === 1 ? 'member' : 'members'}.
        Contact info is set by each member in their{' '}
        <Link
          href='/account'
          className='text-gold hover:text-navy transition-colors underline underline-offset-2'
        >
          account settings
        </Link>
        .
      </p>

      <div className='flex flex-col gap-2'>
        {members.map((member) => (
          <div
            key={member.id}
            className='bg-white border border-cream-mid px-5 py-3 grid grid-cols-1 sm:grid-cols-[1fr_160px_200px] items-start gap-x-6 gap-y-3 sm:gap-y-0'
          >
            <p className='font-serif text-xl font-light text-navy'>
              {member.full_name}
            </p>

            <div>
              <p className='font-mono text-label uppercase tracking-[0.18em] text-sand mb-0.5'>
                Phone
              </p>
              {member.phone ? (
                <p className='font-mono text-label text-navy/70'>
                  {member.phone}
                </p>
              ) : (
                <p className='font-mono text-label text-navy/25'>—</p>
              )}
            </div>

            <div>
              <p className='font-mono text-label uppercase tracking-[0.18em] text-sand mb-0.5'>
                Discord
              </p>
              {member.discord ? (
                <p className='font-mono text-label text-navy/70'>
                  {member.discord}
                </p>
              ) : (
                <p className='font-mono text-label text-navy/25'>—</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
