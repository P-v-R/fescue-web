import { emailShell } from './shared'

type InviteEmailData = {
  inviteUrl: string
  recipientEmail: string
  recipientName?: string | null
  expiresAt: string
}

export function inviteEmailHtml({ inviteUrl, recipientName, expiresAt }: InviteEmailData): string {
  const greeting = recipientName ? `${recipientName},` : 'there,'
  return emailShell(`
    <tr>
      <td style="padding:48px 40px;">

        <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
          Member Invitation
        </p>
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#004225;">
          Hey ${greeting}
        </p>
        <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#004225;line-height:1.3;">
          You're invited to<br />join the club.
        </h1>

        <div style="width:48px;height:1px;background-color:#B8963C;margin:0 0 28px;"></div>

        <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#2a2a2a;line-height:1.7;font-weight:300;">
          You've been personally invited to become a member of Fescue Golf Club —
          a private golf simulator club for those who take the game seriously.
        </p>

        <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:15px;color:#2a2a2a;line-height:1.7;font-weight:300;">
          Click the button below to complete your registration and access the member portal.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background-color:#004225;box-shadow:inset 0 -2px 0 0 rgba(184,150,60,0.5);">
              <a href="${inviteUrl}"
                 style="display:inline-block;padding:16px 36px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:#F5F0E8;text-transform:uppercase;text-decoration:none;">
                Accept Invitation
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-family:'Courier New',monospace;font-size:9px;color:#6b6b6b;letter-spacing:0.15em;">
          This invitation expires on ${expiresAt}. If you did not expect this email,
          you may safely ignore it.
        </p>

      </td>
    </tr>
  `)
}

export function inviteEmailText({ inviteUrl, recipientName, expiresAt }: InviteEmailData): string {
  const greeting = recipientName ? `Hey ${recipientName},` : `Hey there,`
  return `${greeting}

You're invited to join Fescue Golf Club.

Complete your registration here:
${inviteUrl}

This invitation expires on ${expiresAt}.

If you did not expect this email, you may safely ignore it.

— Fescue Golf Club`
}
