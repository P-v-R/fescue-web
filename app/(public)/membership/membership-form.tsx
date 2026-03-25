'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { membershipRequestSchema, type MembershipRequestInput } from '@/lib/validations/membership-request'
import { submitMembershipRequestAction } from './actions'
import { formatPhone } from '@/lib/utils/phone'

export function MembershipForm() {
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<MembershipRequestInput>({
    resolver: zodResolver(membershipRequestSchema),
  })

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
          A member of our team will be in touch shortly to arrange your visit.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Name row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block font-mono text-label uppercase tracking-[0.2em] text-navy/60 mb-2">
            First Name
          </label>
          <input
            {...register('first_name')}
            type="text"
            placeholder="James"
            className="w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
          />
          {errors.first_name && (
            <p className="font-mono text-label text-red-500 mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block font-mono text-label uppercase tracking-[0.2em] text-navy/60 mb-2">
            Last Name
          </label>
          <input
            {...register('last_name')}
            type="text"
            placeholder="Morrison"
            className="w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
          />
          {errors.last_name && (
            <p className="font-mono text-label text-red-500 mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block font-mono text-label uppercase tracking-[0.2em] text-navy/60 mb-2">
          Email Address
        </label>
        <input
          {...register('email')}
          type="email"
          placeholder="james@example.com"
          className="w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
        />
        {errors.email && (
          <p className="font-mono text-label text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block font-mono text-label uppercase tracking-[0.2em] text-navy/60 mb-2">
          Phone <span className="normal-case text-navy/25">(optional)</span>
        </label>
        <input
          {...register('phone')}
          type="tel"
          placeholder="(555) 000-0000"
          className="w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
          onChange={(e) => setValue('phone', formatPhone(e.target.value), { shouldValidate: true })}
        />
      </div>

      {/* Referral */}
      <div>
        <label className="block font-mono text-label uppercase tracking-[0.2em] text-navy/60 mb-2">
          How did you hear about us? <span className="normal-case text-navy/25">(optional)</span>
        </label>
        <input
          {...register('referral_source')}
          type="text"
          placeholder="A friend, social media…"
          className="w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block font-mono text-label uppercase tracking-[0.2em] text-navy/60 mb-2">
          Message <span className="normal-case text-navy/25">(optional)</span>
        </label>
        <textarea
          {...register('message')}
          rows={4}
          placeholder="Anything you'd like us to know before the tour…"
          className="w-full border-b border-cream-mid bg-transparent pb-2 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors resize-none"
        />
      </div>

      {serverError && (
        <p className="font-mono text-label text-red-500">{serverError}</p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto bg-navy text-cream font-mono text-label uppercase tracking-[0.25em] px-10 py-3 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Send Request'}
        </button>
      </div>
    </form>
  )
}
