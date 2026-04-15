import { emailShell } from './shared'

export function membershipNotificationEmail({
  full_name,
  email,
  phone,
  profession,
  referral_source,
  message,
}: {
  full_name: string
  email: string
  phone: string
  profession: string
  referral_source: string
  message?: string
}) {
  const row = (label: string, value: string) =>
    value
      ? `<tr>
          <td style="padding:4px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;color:#9B9182;text-transform:uppercase;width:130px;vertical-align:top;">${label}</td>
          <td style="padding:4px 0;font-family:Georgia,serif;font-size:13px;color:#004225;vertical-align:top;">${value}</td>
        </tr>`
      : ''

  const body = `
  <tr>
    <td style="padding:32px 40px 12px;">
      <p style="margin:0 0 20px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.3em;color:#B8963C;text-transform:uppercase;">New Membership Inquiry</p>
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;font-weight:normal;color:#004225;">${full_name}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;">
        ${row('Email', email)}
        ${row('Phone', phone)}
        ${row('Profession', profession)}
        ${row('Referred by', referral_source)}
        ${message ? row('Message', `<em>${message}</em>`) : ''}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 40px 32px;">
      <a href="mailto:${email}" style="display:inline-block;background-color:#004225;color:#F5F0E8;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;text-decoration:none;padding:12px 24px;">
        Reply to ${full_name}
      </a>
    </td>
  </tr>`

  return {
    subject: `New membership inquiry — ${full_name}`,
    html: emailShell(body),
  }
}
