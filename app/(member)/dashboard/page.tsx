import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getBulletinPosts } from '@/lib/sanity/queries';
import { getAllUpcomingEvents } from '@/lib/supabase/queries/events';
import { getUpcomingMemberBookings } from '@/lib/supabase/queries/bookings';
import { BulletinPostCard } from '@/components/bulletin/bulletin-post';
import { UpcomingEvents } from '@/components/bulletin/upcoming-events';
import { UpcomingReservations } from '@/components/reservations/upcoming-reservations';

export const metadata = {
  title: 'Dashboard — Fescue',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [memberResult, posts, upcomingEvents, upcomingBookings] = await Promise.all([
    supabase.from('members').select('full_name').eq('id', user!.id).single(),
    getBulletinPosts(),
    getAllUpcomingEvents(),
    getUpcomingMemberBookings(user!.id),
  ]);

  const firstName = memberResult.data?.full_name?.split(' ')[0] ?? 'Member';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Quail watermark — bottom-right of page */}
      <div className='fixed bottom-0 right-0 pointer-events-none select-none hidden lg:block opacity-[0.07] z-0'>
        <Image
          src='/logo-quail.png'
          alt=''
          width={320}
          height={380}
          className='object-contain brightness-0 invert'
        />
      </div>

      {/* Welcome header */}
      <div className='mb-10 relative'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-2'>
          Member Portal
        </p>
        <h1 className='font-serif text-2xl sm:text-display font-light text-navy'>
          <em>{greeting},</em> {firstName}.
        </h1>
      </div>

      {/* Section divider */}
      <OrnamentDivider className='mb-10' />

      {/* Quick actions */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch mb-10'>
        <QuickAction
          href='/calendar'
          variant='primary'
          label='Upcoming Events'
          description='Browse upcoming club events and social gatherings'
          cta='View Calendar'
        />
        <QuickAction
          href='/reservations'
          variant='outline'
          label='Book a Bay'
          description='Reserve a simulator slot for yourself or a guest'
          cta='Reserve Now'
        />
      </div>

      {/* Section divider */}
      <OrnamentDivider className='mb-10' />

      {/* Main content grid */}
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8'>
        {/* Bulletin feed */}
        <div>
          <p className='font-mono text-label uppercase tracking-[0.28em] text-sage mb-5'>
            Bulletin Board
          </p>

          {posts.length === 0 ? (
            <div className='bg-white border border-cream-mid px-6 py-8 text-center'>
              <p className='font-serif italic text-xl text-sand'>
                No posts yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              {posts.map((post) => (
                <BulletinPostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='lg:border-l lg:border-cream-mid lg:pl-8 flex flex-col gap-8 lg:self-start lg:sticky lg:top-8'>
          <UpcomingEvents events={upcomingEvents.slice(0, 3)} />
          <UpcomingReservations bookings={upcomingBookings} />
        </div>
      </div>
    </div>
  );
}

function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className='flex-1 h-px bg-sand/40' />
      <div className='w-2 h-2 bg-gold/50 rotate-45 shrink-0' />
      <div className='flex-1 h-px bg-sand/40' />
    </div>
  );
}

type QuickActionProps = {
  href: string;
  variant: 'primary' | 'outline';
  label: string;
  description: string;
  cta: string;
};

function QuickAction({
  href,
  variant,
  label,
  description,
  cta,
}: QuickActionProps) {
  const isPrimary = variant === 'primary';
  return (
    <Link
      href={href}
      className={[
        'group block px-6 py-6 transition-all duration-200 relative overflow-hidden min-h-[160px]',
        isPrimary
          ? 'bg-navy hover:bg-navy-mid'
          : 'bg-white border border-cream-mid hover:border-navy/30',
      ].join(' ')}
    >
      {/* All-corner ticks */}
      <span
        className={[
          'absolute top-0 left-0 w-5 h-5 border-t border-l',
          isPrimary ? 'border-gold/40' : 'border-sand/60',
        ].join(' ')}
      />
      <span
        className={[
          'absolute top-0 right-0 w-5 h-5 border-t border-r',
          isPrimary ? 'border-gold/40' : 'border-sand/60',
        ].join(' ')}
      />
      <span
        className={[
          'absolute bottom-0 left-0 w-5 h-5 border-b border-l',
          isPrimary ? 'border-gold/40' : 'border-sand/60',
        ].join(' ')}
      />
      <span
        className={[
          'absolute bottom-0 right-0 w-5 h-5 border-b border-r transition-colors duration-200',
          isPrimary
            ? 'border-gold/40'
            : 'border-sand/60 group-hover:border-navy/30',
        ].join(' ')}
      />

      {/* Double inset frame: both scalloped */}
      {isPrimary ? (
        <>
          <div className='frame-scalloped absolute inset-2 pointer-events-none' />
          <div className='frame-scalloped absolute inset-[10px] pointer-events-none' />
        </>
      ) : (
        <>
          <div className='frame-scalloped frame-scalloped-cream absolute inset-2 pointer-events-none' />
          <div className='frame-scalloped frame-scalloped-cream absolute inset-[10px] pointer-events-none' />
        </>
      )}

      <p
        className={[
          'font-mono text-label uppercase tracking-[0.22em] mb-2',
          isPrimary ? 'text-gold/80' : 'text-sage',
        ].join(' ')}
      >
        {label}
      </p>
      <p
        className={[
          'font-sans text-sm font-light leading-relaxed mb-6',
          isPrimary ? 'text-cream/70' : 'text-navy/55',
        ].join(' ')}
      >
        {description}
      </p>
      <span
        className={[
          'font-serif italic font-normal text-base transition-colors duration-200',
          isPrimary
            ? 'text-cream/80 group-hover:text-cream'
            : 'text-navy/50 group-hover:text-navy',
        ].join(' ')}
      >
        {cta} →
      </span>
    </Link>
  );
}
