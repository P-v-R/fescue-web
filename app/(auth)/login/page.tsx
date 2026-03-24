import Link from 'next/link'
import { AuthCard } from '@/components/ui/auth-card'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Sign In — Fescue Golf Club',
}

export default function LoginPage() {
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
      <LoginForm />
    </AuthCard>
  )
}
