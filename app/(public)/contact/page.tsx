import { MembershipForm } from '@/app/(public)/membership/membership-form'

export const metadata = {
  title: 'Membership — Fescue Golf Club',
}

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <div className="mb-12">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-1">
          Join the Club
        </p>
        <h1 className="font-serif text-3xl sm:text-display font-light text-navy">
          Membership
        </h1>
        <div className="w-12 h-px bg-gold mt-4" />
        <p className="font-sans text-base text-navy/55 font-light mt-5 leading-relaxed">
          Fescue is a private club. Fill out the form below and a member of our
          team will reach out to discuss membership.
        </p>
      </div>

      <MembershipForm />
    </div>
  )
}
