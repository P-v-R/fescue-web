import { emailShell } from './shared'

type IntroEmailData = {
  firstName: string
  scheduleUrl: string
}

const CLUB_ADDRESS = '123 Fairway Lane, Suite 100, Your City, ST 00000'
const CLUB_PHONE = '(555) 000-0000'

export function introEmailHtml({ firstName, scheduleUrl }: IntroEmailData): string {
  return emailShell(`
    <tr>
      <td style="padding:48px 40px;">

        <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
          Tour Request
        </p>
        <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:16px;font-weight:300;color:#004225;">
          Hi ${firstName},
        </p>
        <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#004225;line-height:1.3;">
          Thanks for your<br />interest in Fescue.
        </h1>

        <div style="width:48px;height:1px;background-color:#B8963C;margin:0 0 28px;"></div>

        <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#2a2a2a;line-height:1.7;font-weight:300;">
          We've received your request and would love to show you around. Fescue is a
          private golf simulator club — a serious space for people who love the game,
          available to book by the hour any time of year.
        </p>

        <p style="margin:0 0 32px;font-family:Georgia,serif;font-size:15px;color:#2a2a2a;line-height:1.7;font-weight:300;">
          Use the link below to schedule a time that works for you and we'll give you
          a private walkthrough of the facility.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background-color:#004225;box-shadow:inset 0 -2px 0 0 rgba(184,150,60,0.5);">
              <a href="${scheduleUrl}"
                 style="display:inline-block;padding:16px 36px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:#F5F0E8;text-transform:uppercase;text-decoration:none;">
                Schedule a Visit
              </a>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:40px;border-top:1px solid #E8E1D6;padding-top:28px;">
          <tr>
            <td>
              <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;color:#B8963C;text-transform:uppercase;">
                Find Us
              </p>
              <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:14px;color:#2a2a2a;line-height:1.6;font-weight:300;">
                ${CLUB_ADDRESS}
              </p>
              <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#2a2a2a;font-weight:300;">
                ${CLUB_PHONE}
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  `)
}

export function introEmailText({ firstName, scheduleUrl }: IntroEmailData): string {
  return `Hi ${firstName},

Thanks for your interest in Fescue Golf Club.

We'd love to show you around. Use the link below to schedule a time for a private walkthrough of the facility.

Schedule a visit: ${scheduleUrl}

—

${CLUB_ADDRESS}
${CLUB_PHONE}

Fescue Golf Club · Private Membership`
}
