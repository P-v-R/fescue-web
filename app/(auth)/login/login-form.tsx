'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { loginAction } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    const result = await loginAction(data)
    if (result?.error) {
      setServerError(result.error)
    }
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

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      {serverError && (
        <p className="font-mono text-label tracking-[0.15em] uppercase text-red-500">
          {serverError}
        </p>
      )}

      <div className="pt-2">
        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign In
        </Button>
      </div>

      <div className="flex items-center justify-center pt-2">
        <Link
          href="/forgot-password"
          className="font-serif italic text-label text-sand hover:text-gold transition-colors duration-200 after:content-['_→'] after:text-gold"
        >
          Forgot password
        </Link>
      </div>
    </form>
  )
}
