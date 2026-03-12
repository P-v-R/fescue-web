type InviteEmailData = {
  inviteUrl: string
  recipientEmail: string
  recipientName?: string | null
  expiresAt: string // formatted date string
}

export function inviteEmailHtml({ inviteUrl, recipientName, expiresAt }: InviteEmailData): string {
  const greeting = recipientName ? `${recipientName},` : 'there,'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Fescue Membership Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #E8E1D6;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0A2B5E;padding:36px 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;letter-spacing:0.18em;color:#F5F0E8;text-transform:uppercase;">
                Fescue
              </p>
              <p style="margin:8px 0 0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
                Golf Club
              </p>
            </td>
          </tr>

          <!-- Gold divider -->
          <tr>
            <td style="height:3px;background-color:#B8963C;"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 40px;">

              <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
                Member Invitation
              </p>
              <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#0A2B5E;">
                Hey ${greeting}
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#0A2B5E;line-height:1.3;">
                You're invited to<br />join the club.
              </h1>

              <div style="width:48px;height:1px;background-color:#B8963C;margin:0 0 28px;"></div>

              <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#4A4A4A;line-height:1.7;font-weight:300;">
                You've been personally invited to become a member of Fescue Golf Club —
                a private golf simulator club for those who take the game seriously.
              </p>

              <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:15px;color:#4A4A4A;line-height:1.7;font-weight:300;">
                Click the button below to complete your registration and access the member portal.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#0A2B5E;box-shadow:inset 0 -2px 0 0 rgba(184,150,60,0.5);">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:16px 36px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:#F5F0E8;text-transform:uppercase;text-decoration:none;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-family:'Courier New',monospace;font-size:9px;color:#9B9182;letter-spacing:0.15em;">
                This invitation expires on ${expiresAt}. If you did not expect this email,
                you may safely ignore it.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F0E8;padding:24px 40px;border-top:1px solid #E8E1D6;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#9B9182;text-align:center;text-transform:uppercase;">
                Fescue Golf Club &nbsp;·&nbsp; Private Membership
              </p>
              <p style="margin:8px 0 0;font-family:'Courier New',monospace;font-size:8px;color:#9B9182;text-align:center;">
                If the button doesn't work, copy this link: ${inviteUrl}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
