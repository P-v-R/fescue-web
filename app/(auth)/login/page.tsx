import Link from 'next/link'
import { AuthCard } from '@/components/ui/auth-card'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Sign In — Fescue Golf Club',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <AuthCard
      title="Sign in to your account"
      subtitle={
        <>
          Members only.{' '}
          <Link href="/join" className="text-gold hover:text-gold-dark underline underline-offset-2 transition-colors">
            Request access
          </Link>
          {' '}if you don&apos;t have an account.
        </>
      }
    >
      {error === 'not_a_member' && (
        <p className="font-mono text-label tracking-[0.15em] uppercase text-red-500 mb-4">
          No membership found for that Google account. Contact the club to request access.
        </p>
      )}
      <LoginForm />
    </AuthCard>
  )
}
