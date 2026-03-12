export const metadata = {
  title: 'Request a Tour — Fescue Golf Club',
};

export default function ContactPage() {
  return (
    <div className='max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24'>
      {/* Header */}
      <div className='mb-12'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold mb-1'>
          Come Visit
        </p>
        <h1 className='font-serif text-3xl sm:text-display font-light text-navy'>
          Request a Tour
        </h1>
        <div className='w-12 h-px bg-gold mt-4' />
        <p className='font-sans text-base text-navy/55 font-light mt-5 leading-relaxed'>
          Interested in becoming a member? Fill out the form below and we will
          be in touch to schedule a private walkthrough of the facility.
        </p>
      </div>

      {/* Form skeleton */}
      <form className='space-y-8' action='#'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          <div>
            <label className='block font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
              First Name
            </label>
            <input
              type='text'
              placeholder='James'
              className='w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors'
            />
          </div>
          <div>
            <label className='block font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
              Last Name
            </label>
            <input
              type='text'
              placeholder='Morrison'
              className='w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors'
            />
          </div>
        </div>

        <div>
          <label className='block font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
            Email Address
          </label>
          <input
            type='email'
            placeholder='james@example.com'
            className='w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors'
          />
        </div>

        <div>
          <label className='block font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
            Phone <span className='normal-case text-navy/25'>(optional)</span>
          </label>
          <input
            type='tel'
            placeholder='(555) 000-0000'
            className='w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors'
          />
        </div>

        <div>
          <label className='block font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
            How did you hear about us?{' '}
            <span className='normal-case text-navy/25'>(optional)</span>
          </label>
          <input
            type='text'
            placeholder='A friend, social media…'
            className='w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors'
          />
        </div>

        <div>
          <label className='block font-mono text-label uppercase tracking-[0.2em] text-navy/40 mb-2'>
            Message <span className='normal-case text-navy/25'>(optional)</span>
          </label>
          <textarea
            rows={4}
            placeholder="Anything you'd like us to know before the tour…"
            className='w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors resize-none'
          />
        </div>

        <div className='pt-2'>
          <button
            type='submit'
            className='w-full sm:w-auto bg-navy text-cream font-mono text-label uppercase tracking-[0.25em] px-10 py-3 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity'
          >
            Send Request
          </button>
        </div>
      </form>
    </div>
  );
}
