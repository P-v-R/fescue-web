type WelcomeEmailData = {
  loginUrl: string
  recipientName: string
}

export function welcomeEmailHtml({ loginUrl, recipientName }: WelcomeEmailData): string {
  const firstName = recipientName.split(' ')[0] ?? recipientName
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Fescue Golf Club</title>
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
                Welcome
              </p>
              <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#0A2B5E;">
                Hey ${firstName},
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#0A2B5E;line-height:1.3;">
                You're in.<br /><em>Welcome to the club.</em>
              </h1>

              <div style="width:48px;height:1px;background-color:#B8963C;margin:0 0 28px;"></div>

              <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#4A4A4A;line-height:1.7;font-weight:300;">
                Your membership request has been approved. You can now sign in to the
                Fescue member portal to book a bay, view the calendar, and connect
                with the club.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#0A2B5E;box-shadow:inset 0 -2px 0 0 rgba(184,150,60,0.5);">
                    <a href="${loginUrl}"
                       style="display:inline-block;padding:16px 36px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:#F5F0E8;text-transform:uppercase;text-decoration:none;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-family:'Courier New',monospace;font-size:9px;color:#9B9182;letter-spacing:0.15em;">
                Use the email address and password you set when you applied.
                If you have any trouble, reply to this email and we'll help you get in.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F0E8;padding:24px 40px;border-top:1px solid #E8E1D6;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#9B9182;text-align:center;text-transform:uppercase;">
                Fescue Golf Club &nbsp;·&nbsp; Private Membership
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

export function welcomeEmailText({ loginUrl, recipientName }: WelcomeEmailData): string {
  const firstName = recipientName.split(' ')[0] ?? recipientName
  return `Hey ${firstName},

You're in. Welcome to Fescue Golf Club.

Your membership request has been approved. Sign in to the member portal here:
${loginUrl}

Use the email and password you set when you applied.

— Fescue Golf Club`
}
