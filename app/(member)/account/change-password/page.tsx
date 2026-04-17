'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/account'), 2000)
    }
  }

  return (
    <div className="max-w-md space-y-6">

      {/* Header */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold/70 mb-1">
          Account
        </p>
        <h1 className="font-serif text-2xl font-light text-navy">Change Password</h1>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>

      <div className="bg-white border border-cream-mid">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
          <span className="text-gold/70 text-sm leading-none">◈</span>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">
            New Password
          </p>
        </div>
        <div className="px-6 py-5">
          {success ? (
            <div className="py-2 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sage">
                Password updated ✓
              </p>
              <p className="font-mono text-[10px] text-navy/40 mt-1 tracking-[0.08em]">
                Redirecting to account…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />
              {serverError && (
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-red-500">
                  {serverError}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" loading={isSubmitting}>
                  Update Password
                </Button>
                <button
                  type="button"
                  onClick={() => router.push('/account')}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 hover:text-navy transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
