import { emailShell } from './shared'

type WelcomeEmailData = {
  loginUrl: string
  recipientName: string
}

export function welcomeEmailHtml({ loginUrl, recipientName }: WelcomeEmailData): string {
  const firstName = recipientName.split(' ')[0] ?? recipientName
  return emailShell(`
    <tr>
      <td style="padding:48px 40px;">

        <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
          Welcome
        </p>
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#004225;">
          Hey ${firstName},
        </p>
        <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#004225;line-height:1.3;">
          You're in.<br /><em>Welcome to the club.</em>
        </h1>

        <div style="width:48px;height:1px;background-color:#B8963C;margin:0 0 28px;"></div>

        <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#2a2a2a;line-height:1.7;font-weight:300;">
          Your membership request has been approved. You can now sign in to the
          Fescue member portal to book a bay, view the calendar, and connect
          with the club.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
          <tr>
            <td bgcolor="#f5f0e8" style="background-color:#f5f0e8;border-left:3px solid #B8963C;padding:14px 20px;">
              <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;color:#B8963C;text-transform:uppercase;">
                Note
              </p>
              <p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#2a2a2a;line-height:1.6;font-weight:300;">
                The portal will be fully live and functional by <strong>5am PT on April 18th</strong>. We expect a brief maintenance period starting the evening of April 17th. If you try to sign in before then and run into any issues, sit tight — everything will be up shortly.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td bgcolor="#004225" style="background-color:#004225;box-shadow:inset 0 -2px 0 0 rgba(184,150,60,0.5);">
              <a href="${loginUrl}"
                 style="display:inline-block;padding:16px 36px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:#F5F0E8;text-transform:uppercase;text-decoration:none;">
                Sign In
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 8px;font-family:'Courier New',monospace;font-size:9px;color:#6b6b6b;letter-spacing:0.12em;">
          Use the email address and password you set when you applied.
        </p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:9px;color:#6b6b6b;letter-spacing:0.12em;">
          Need help? Reach us at <a href="mailto:${process.env.OWNER_EMAIL}" style="color:#004225;text-decoration:none;">${process.env.OWNER_EMAIL}</a> — replies to this email are not monitored.
        </p>

      </td>
    </tr>
  `)
}

export function welcomeEmailText({ loginUrl, recipientName }: WelcomeEmailData): string {
  const firstName = recipientName.split(' ')[0] ?? recipientName
  return `Hey ${firstName},

You're in. Welcome to Fescue Golf Club.

Your membership request has been approved. Sign in to the member portal here:
${loginUrl}

Note: The portal will be fully live by 5am PT on April 18th. We expect a brief maintenance period starting the evening of April 17th — if you run into issues before then, everything will be up shortly.

Use the email and password you set when you applied.

— Fescue Golf Club`
}
