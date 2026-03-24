'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { joinRequestSchema, type JoinRequestInput } from '@/lib/validations/join-request'
import { submitJoinRequestAction } from './actions'
import { formatPhone } from '@/lib/utils/phone'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function JoinForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinRequestInput>({
    resolver: zodResolver(joinRequestSchema),
  })

  async function onSubmit(data: JoinRequestInput) {
    setServerError(null)
    const result = await submitJoinRequestAction(data)
    if (result?.error) {
      setServerError(result.error)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className='border border-cream-mid bg-white p-8'>
        <p className='font-mono text-label uppercase tracking-[0.28em] text-gold-dark mb-2'>
          Request Received
        </p>
        <h2 className='font-serif text-xl font-light text-navy mb-4'>
          We&apos;ll be in touch soon.
        </h2>
        <div className='w-8 h-px bg-gold mb-5' />
        <p className='font-sans text-sm text-navy/65 leading-relaxed'>
          Your request has been submitted. A club administrator will review it
          and send you a confirmation email once your account is approved.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className='flex flex-col gap-6'>
      <Input
        label='Full Name'
        type='text'
        autoComplete='name'
        placeholder='Jane Smith'
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <Input
        label='Email'
        type='email'
        autoComplete='email'
        placeholder='you@example.com'
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label='Phone'
        type='tel'
        autoComplete='tel'
        placeholder='(555) 000-0000'
        error={errors.phone?.message}
        {...register('phone')}
        onChange={(e) => setValue('phone', formatPhone(e.target.value), { shouldValidate: true })}
      />

      <div className='flex flex-col gap-2'>
        <Input
          label='Discord Username'
          type='text'
          placeholder='yourname or yourname#1234'
          error={errors.discord?.message}
          {...register('discord')}
        />
        <p className='font-mono text-label text-navy/40 tracking-[0.1em]'>
          Discord is our primary means of club communication.
        </p>
      </div>

      <div className='w-full h-px bg-cream-mid' />

      <Input
        label='Password'
        type='password'
        autoComplete='new-password'
        placeholder='Minimum 8 characters'
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label='Confirm Password'
        type='password'
        autoComplete='new-password'
        placeholder='Repeat your password'
        error={errors.confirm_password?.message}
        {...register('confirm_password')}
      />

      {serverError && (
        <p className='font-mono text-label tracking-[0.15em] uppercase text-red-500'>
          {serverError}
        </p>
      )}

      <div className='pt-2'>
        <Button type='submit' loading={isSubmitting} className='w-full'>
          Submit Request
        </Button>
      </div>
    </form>
  )
}
