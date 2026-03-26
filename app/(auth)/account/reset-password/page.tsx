'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { AuthCard } from '@/components/ui/auth-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type PageState = 'loading' | 'ready' | 'success' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Supabase exchanges the recovery token from the URL hash automatically.
    // Listen for the PASSWORD_RECOVERY event to know when the session is ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready')
      }
    })

    // Also check if already in a recovery session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPageState('ready')
    })

    return () => subscription.unsubscribe()
  }, [])

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(error.message)
    } else {
      setPageState('success')
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  if (pageState === 'loading') {
    return (
      <AuthCard title="Reset your password" subtitle="Verifying your reset link…">
        <div className="flex justify-center py-4">
          <span className="font-mono text-label uppercase tracking-[0.2em] text-sand/50 animate-pulse">
            Loading…
          </span>
        </div>
      </AuthCard>
    )
  }

  if (pageState === 'invalid') {
    return (
      <AuthCard
        title="Link expired"
        subtitle="This reset link is no longer valid. Please request a new one."
      >
        <Button onClick={() => router.push('/forgot-password')} className="w-full">
          Request new link
        </Button>
      </AuthCard>
    )
  }

  if (pageState === 'success') {
    return (
      <AuthCard title="Password updated" subtitle="You're all set. Redirecting to your dashboard…">
        <div className="flex justify-center py-2">
          <div className="w-2 h-2 bg-gold rotate-45" />
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Must be at least 8 characters."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
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
          <p className="font-mono text-label tracking-[0.15em] uppercase text-red-500">
            {serverError}
          </p>
        )}

        <div className="pt-2">
          <Button type="submit" loading={isSubmitting} className="w-full">
            Update Password
          </Button>
        </div>
      </form>
    </AuthCard>
  )
}
