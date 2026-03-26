const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fescuegolfclub.com'
const LOGO_URL = `${APP_URL}/logo-badge2.png`

export const emailHeader = `
  <!-- Header -->
  <tr>
    <td style="background-color:#004225;padding:32px 40px 28px;text-align:center;">
      <img src="${LOGO_URL}" width="56" height="56" alt="Fescue Golf Club"
           style="display:block;margin:0 auto 14px;border:0;" />
      <p style="margin:0;font-family:Georgia,serif;font-size:20px;letter-spacing:0.22em;color:#F5F0E8;text-transform:uppercase;">
        Fescue
      </p>
      <p style="margin:6px 0 0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.3em;color:#B8963C;text-transform:uppercase;">
        Golf Club
      </p>
    </td>
  </tr>

  <!-- Gold divider -->
  <tr>
    <td style="height:3px;background-color:#B8963C;"></td>
  </tr>
`

export const emailFooter = `
  <!-- Footer -->
  <tr>
    <td style="background-color:#F5F0E8;padding:24px 40px;border-top:1px solid #E8E1D6;">
      <p style="margin:0;font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.2em;color:#9B9182;text-align:center;text-transform:uppercase;">
        Fescue Golf Club &nbsp;·&nbsp; Private Membership
      </p>
    </td>
  </tr>
`

export const emailShell = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border:1px solid #E8E1D6;">
          ${emailHeader}
          ${body}
          ${emailFooter}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
