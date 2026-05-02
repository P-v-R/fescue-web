import { emailShell } from './shared';

/** Escapes a string for safe use in an HTML email body. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Escapes a value for safe interpolation into an iCalendar TEXT property.
 * Strips newlines (which would inject new property lines) and escapes
 * backslash, semicolon, and comma per RFC 5545 §3.3.11.
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/[\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .slice(0, 200)
}

interface TourInviteParams {
  firstName: string;
  tourDateFormatted: string; // e.g. "Wednesday, May 15 at 10:00 AM"
}

export function tourInviteHtml({
  firstName,
  tourDateFormatted,
}: TourInviteParams): string {
  return emailShell(`
  <!-- Body -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:40px 40px 12px;">
      <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;color:#B8963C;text-transform:uppercase;">
        Tour Confirmation
      </p>
      <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#004225;line-height:1.3;">
        We&rsquo;ll see you soon,<br />${escapeHtml(firstName)}.
      </h1>
      <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#3D3530;line-height:1.7;">
        Your tour of Fescue Golf Club is confirmed for:
      </p>
    </td>
  </tr>

  <!-- Date block -->
  <tr>
    <td bgcolor="#F5F0E8" style="background-color:#F5F0E8;padding:20px 40px;border-top:1px solid #E8E1D6;border-bottom:1px solid #E8E1D6;">
      <p style="margin:0;font-family:'Courier New',monospace;font-size:13px;letter-spacing:0.08em;color:#004225;text-align:center;">
        ${tourDateFormatted}
      </p>
    </td>
  </tr>

  <!-- Details -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:28px 40px 8px;">
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:15px;color:#3D3530;line-height:1.7;">
        We&rsquo;re located at:
      </p>
      <p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.06em;color:#6B5E57;">
        12211 W Washington Blvd<br />
        Los Angeles, CA 90067
      </p>
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:15px;color:#3D3530;line-height:1.7;">
        A calendar invite is attached to this email. Please add it to your calendar so you don&rsquo;t forget.
      </p>
      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:15px;color:#3D3530;line-height:1.7;">
        Looking forward to showing you the facility. If you have any questions or need to reschedule, please reach out to Sean directly at
        <a href="mailto:sean@fescuegolfclub.com" style="color:#004225;">sean@fescuegolfclub.com</a>.
      </p>
    </td>
  </tr>

  <!-- Signature -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:12px 40px 40px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#6B5E57;line-height:1.6;">
        Warm regards,<br />
        <strong style="color:#3D3530;">Sean Gilmore</strong><br />
        <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#9B9182;">
          Fescue Golf Club
        </span>
      </p>
    </td>
  </tr>
  `);
}

export function tourInviteText({
  firstName,
  tourDateFormatted,
}: TourInviteParams): string {
  return `Hi ${firstName},

Your tour of Fescue Golf Club is confirmed for:
${tourDateFormatted}

Location: 12211 W Washington Blvd, Los Angeles, CA 90067

A calendar invite is attached to this email.

If you have any questions or need to reschedule, please reach out to sean@fescuegolfclub.com directly.

Warm regards,
Sean Gilmore
Fescue Golf Club`;
}

/** Generates a .ics (iCalendar) file content string for the tour. */
export function tourInviteIcs({
  requestId,
  tourDatetimeLocal, // "YYYY-MM-DDTHH:MM" from datetime-local input (LA time)
  prospectEmail,
  prospectName,
}: {
  requestId: string;
  tourDatetimeLocal: string;
  prospectEmail: string;
  prospectName: string;
}): string {
  // Parse as local time (server runs TZ=America/Los_Angeles) and convert to UTC.
  // Using UTC format with Z suffix is unambiguous across all calendar clients —
  // TZID requires an embedded VTIMEZONE block to work correctly in Google Calendar.
  // Requires TZ=America/Los_Angeles in the server environment (see .env.example).
  if (process.env.NODE_ENV !== 'test' && process.env.TZ !== 'America/Los_Angeles') {
    console.warn('[tour-invite] TZ env var is not America/Los_Angeles — ICS event times may be incorrect')
  }
  const tourDate = new Date(tourDatetimeLocal);
  const icsDate = tourDate.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  const uid = `tour-${requestId}-${Date.now()}@fescuegolfclub.com`;

  // Escape commas in location per iCalendar spec
  const location = '12211 W Washington Blvd\\, Los Angeles\\, CA 90067';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fescue Golf Club//Tour Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${icsDate}`,
    'DURATION:PT45M',
    'SUMMARY:Tour — Fescue Golf Club',
    `DESCRIPTION:Tour at Fescue Golf Club for ${escapeIcsText(prospectName)}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=Fescue Golf Club:mailto:noreply@mail.fescuegolfclub.com`,
    `ATTENDEE;CN=${escapeIcsText(prospectName)};ROLE=REQ-PARTICIPANT:mailto:${prospectEmail.replace(/[\r\n]/g, '')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
