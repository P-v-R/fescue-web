'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { forgotPasswordAction } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null)
    const result = await forgotPasswordAction(data)
    if (result?.error) {
      setServerError(result.error)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center flex flex-col gap-4">
        {/* Diamond */}
        <div className="flex justify-center mb-2">
          <div className="w-2 h-2 bg-gold rotate-45" />
        </div>
        <p className="font-serif text-xl font-light text-navy leading-snug">
          Check your inbox
        </p>
        <p className="font-sans text-sm font-light text-sand leading-relaxed">
          If <span className="text-navy">{getValues('email')}</span> is registered,
          you&apos;ll receive a reset link shortly. Check your spam folder if you don&apos;t see it.
        </p>
        <div className="pt-4">
          <Link
            href="/login"
            className="font-serif italic text-label text-sand hover:text-gold transition-colors duration-200 after:content-['_→'] after:text-gold"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      {serverError && (
        <p className="font-mono text-label tracking-[0.15em] uppercase text-red-500">
          {serverError}
        </p>
      )}

      <div className="pt-2">
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send Reset Link
        </Button>
      </div>

      <div className="flex items-center justify-center pt-2">
        <Link
          href="/login"
          className="font-serif italic text-label text-sand hover:text-gold transition-colors duration-200 after:content-['_→'] after:text-gold"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
