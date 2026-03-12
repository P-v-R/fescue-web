import { getInviteByToken } from '@/lib/supabase/queries/invites'
import { AuthCard } from '@/components/ui/auth-card'
import { InviteForm } from './invite-form'

export const metadata = {
  title: 'Join Fescue Golf Club',
}

type Props = {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const invite = await getInviteByToken(token)

  // ─── Invalid invite states ───────────────────────────────────────────────
  if (!invite) {
    return (
      <AuthCard title="Invitation not found">
        <InvalidInvite message="This invite link is invalid or has already been used. Please contact the club to request a new one." />
      </AuthCard>
    )
  }

  if (invite.accepted_at) {
    return (
      <AuthCard title="Already registered">
        <InvalidInvite message="This invite link has already been used. If you need help accessing your account, contact the club." />
      </AuthCard>
    )
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <AuthCard title="Invite expired">
        <InvalidInvite message="This invite link expired 30 days after it was sent. Please contact the club to request a new invitation." />
      </AuthCard>
    )
  }

  // ─── Valid invite ─────────────────────────────────────────────────────────
  const title = invite.name ? `Welcome, ${invite.name}.` : 'Welcome to Fescue.'

  return (
    <AuthCard
      title={title}
      subtitle="You've been invited. Set up your account below."
    >
      <InviteForm token={token} inviteEmail={invite.email} />
    </AuthCard>
  )
}

function InvalidInvite({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-sm font-light text-sand leading-relaxed">{message}</p>
      <div className="pt-2">
        <a
          href="mailto:hello@fescuegolf.com"
          className="font-serif italic text-label text-sand hover:text-gold transition-colors duration-200 after:content-['_→'] after:text-gold"
        >
          Contact the club
        </a>
      </div>
    </div>
  )
}
