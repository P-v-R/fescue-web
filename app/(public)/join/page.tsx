import { JoinForm } from './join-form'

export const metadata = {
  title: 'Request Access — Fescue Golf Club',
}

export default function JoinPage() {
  return (
    <div className='max-w-lg mx-auto px-4 sm:px-8 py-16 sm:py-24'>
      <div className='mb-12'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-1'>
          Member Access
        </p>
        <h1 className='font-serif text-3xl sm:text-display font-light text-navy'>
          Request Access
        </h1>
        <div className='w-12 h-px bg-gold mt-4' />
        <p className='font-sans text-base text-navy/55 font-light mt-5 leading-relaxed'>
          Fill out the form below to request a member account. A club administrator
          will review your request and notify you once it&apos;s approved.
        </p>
      </div>

      <JoinForm />
    </div>
  )
}
