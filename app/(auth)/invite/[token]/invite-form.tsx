'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { acceptInviteSchema, type AcceptInviteInput } from '@/lib/validations/auth'
import { acceptInviteAction } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  token: string
  inviteEmail: string
}

export function InviteForm({ token, inviteEmail }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
  })

  async function onSubmit(data: AcceptInviteInput) {
    setServerError(null)
    const result = await acceptInviteAction(token, data)
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Email is pre-filled from invite — show read-only */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-sage">Email</p>
        <p className="font-sans text-sm font-light text-navy-dark border-b border-b-sand-light pb-2">
          {inviteEmail}
        </p>
      </div>

      <Input
        label="Full Name"
        type="text"
        autoComplete="name"
        placeholder="Jane Smith"
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="Minimum 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        error={errors.confirm_password?.message}
        {...register('confirm_password')}
      />

      {serverError && (
        <p className="font-mono text-label tracking-[0.15em] uppercase text-red-500">
          {serverError}
        </p>
      )}

      <div className="pt-2">
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create My Account
        </Button>
      </div>
    </form>
  )
}
