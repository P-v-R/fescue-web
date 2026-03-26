'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { membershipRequestSchema, type MembershipRequestInput } from '@/lib/validations/membership-request'
import { submitMembershipRequestAction } from './actions'
import { formatPhone } from '@/lib/utils/phone'

const inputClass =
  'w-full bg-white border border-cream-mid px-3 py-2.5 font-sans text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors'

const labelClass = 'block font-mono text-label uppercase tracking-[0.2em] text-navy/70 mb-2'

const errorClass = 'font-mono text-label text-red-500 mt-1'

export function MembershipForm() {
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<MembershipRequestInput>({
    resolver: zodResolver(membershipRequestSchema),
  })

  const hasMembershipOrg = watch('has_membership_org')

  function onSubmit(data: MembershipRequestInput) {
    setServerError(null)
    startTransition(async () => {
      try {
        const result = await submitMembershipRequestAction(data)
        if (result.error) {
          setServerError(result.error)
        } else if (result.success) {
          setSuccessMessage(result.success)
          setSubmitted(true)
        } else {
          setServerError('Unexpected response. Please try again.')
        }
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      }
    })
  }

  if (submitted) {
    return (
      <div className="py-10">
        <div className="w-8 h-px bg-gold mb-6" />
        <p className="font-serif text-2xl font-light text-navy mb-2">{successMessage}</p>
        <p className="font-sans text-sm text-navy/45 font-light">
          A member of our team will be in touch shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Name */}
      <div>
        <label className={labelClass}>Name</label>
        <input
          {...register('full_name')}
          type="text"
          placeholder="First and Last"
          className={inputClass}
        />
        {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="Email Address"
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className={labelClass}>Phone Number</label>
        <input
          {...register('phone')}
          type="tel"
          placeholder="Contact Number"
          className={inputClass}
          onChange={(e) => setValue('phone', formatPhone(e.target.value), { shouldValidate: true })}
        />
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>

      {/* Zip */}
      <div>
        <label className={labelClass}>
          Home Zip Code <span className="normal-case text-navy/30">(optional)</span>
        </label>
        <input
          {...register('zip_code')}
          type="text"
          placeholder="Enter Zip"
          className={inputClass}
        />
      </div>

      {/* Profession */}
      <div>
        <label className={labelClass}>Profession</label>
        <input
          {...register('profession')}
          type="text"
          placeholder="Enter Profession"
          className={inputClass}
        />
        {errors.profession && <p className={errorClass}>{errors.profession.message}</p>}
      </div>

      {/* Referral */}
      <div>
        <label className={labelClass}>Referral</label>
        <input
          {...register('referral_source')}
          type="text"
          placeholder="How/who referred you to Fescue?"
          className={inputClass}
        />
        {errors.referral_source && <p className={errorClass}>{errors.referral_source.message}</p>}
      </div>

      {/* Membership Orgs */}
      <div>
        <label className={labelClass}>
          Membership Orgs <span className="normal-case text-navy/30">(optional)</span>
        </label>
        <p className="font-sans text-xs text-navy/40 mb-3">
          Have you belonged to a membership organization (i.e. social/country club)?
        </p>
        <div className="flex gap-6">
          {(['Yes', 'No'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="has_membership_org"
                value={opt}
                onChange={() => setValue('has_membership_org', opt === 'Yes', { shouldValidate: true })}
                className="accent-navy w-4 h-4"
              />
              <span className="font-mono text-label uppercase tracking-[0.15em] text-navy/70">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Membership Orgs follow-up */}
      <div>
        <label className={labelClass}>
          Membership Orgs follow up <span className="normal-case text-navy/30">(optional)</span>
        </label>
        <input
          {...register('membership_org_names')}
          type="text"
          placeholder={hasMembershipOrg ? 'Name of club(s)?' : 'If yes: name of club(s)? If no: write "NA"'}
          className={inputClass}
        />
      </div>

      {/* Golf History */}
      <div>
        <label className={labelClass}>
          Golf History <span className="normal-case text-navy/30">(optional)</span>
        </label>
        <textarea
          {...register('message')}
          rows={4}
          placeholder="What is your relationship with the game of golf? (Can be as brief — or long! — as you like…)"
          className={`${inputClass} resize-none`}
        />
      </div>

      {serverError && <p className={errorClass}>{serverError}</p>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto bg-navy text-cream font-mono text-label uppercase tracking-[0.25em] px-10 py-3 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Apply'}
        </button>
      </div>
    </form>
  )
}
