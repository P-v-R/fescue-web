'use client'

import { useState } from 'react'
import { updateProfileAction, updateEmailPreferencesAction } from './actions'
import { formatPhone } from '@/lib/utils/phone'

// ─── Contact info ─────────────────────────────────────────────────────────────
export function ContactInfoSection({
  phone,
  discord,
  sgtUsername,
}: {
  phone: string | null
  discord: string | null
  sgtUsername: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [phoneVal, setPhoneVal] = useState(phone ?? '')
  const [discordVal, setDiscordVal] = useState(discord ?? '')
  const [sgtVal, setSgtVal] = useState(sgtUsername ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateProfileAction({ phone: phoneVal, discord: discordVal, sgt_username: sgtVal })
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  function handleCancel() {
    setPhoneVal(phone ?? '')
    setDiscordVal(discord ?? '')
    setSgtVal(sgtUsername ?? '')
    setEditing(false)
    setError(null)
  }

  return (
    <div className="bg-white border border-cream-mid">
      {/* Card header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
        <span className="text-gold/70 text-sm leading-none">◈</span>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">
          Contact Info
        </p>
        <p className="font-mono text-[9px] text-navy/30 ml-1">
          · Visible in member directory
        </p>
        <div className="ml-auto flex items-center gap-3">
          {saved && (
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-sage">
              Saved ✓
            </span>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40 hover:text-gold border border-cream-mid hover:border-gold/40 px-3 py-1.5 transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 hover:text-navy transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="font-mono text-[10px] uppercase tracking-[0.15em] bg-navy text-cream px-4 py-1.5 hover:bg-navy-mid transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="px-6 py-5 flex flex-col divide-y divide-cream-mid/60">
        <EditableFieldRow
          label="Phone"
          value={phone}
          editValue={phoneVal}
          editing={editing}
          placeholder="(555) 000-0000"
          onChange={(v) => setPhoneVal(formatPhone(v))}
          type="tel"
        />
        <EditableFieldRow
          label="Discord"
          value={discord}
          editValue={discordVal}
          editing={editing}
          placeholder="username or username#1234"
          onChange={setDiscordVal}
        />
        <EditableFieldRow
          label="SGT Username"
          value={sgtUsername}
          editValue={sgtVal}
          editing={editing}
          placeholder="Your Simulator Golf Tour username"
          onChange={setSgtVal}
        />
        {error && (
          <p className="font-mono text-[10px] text-red-500 pt-3">{error}</p>
        )}
      </div>
    </div>
  )
}

// ─── Editable field row ────────────────────────────────────────────────────
function EditableFieldRow({
  label,
  value,
  editValue,
  editing,
  placeholder,
  onChange,
  type = 'text',
}: {
  label: string
  value: string | null
  editValue: string
  editing: boolean
  placeholder: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40 shrink-0 w-28">
        {label}
      </p>
      {editing ? (
        <input
          type={type}
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-cream-mid bg-cream/30 px-3 py-1.5 font-sans text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
        />
      ) : (
        <p className="font-sans text-sm font-light text-navy-dark text-right flex-1">
          {value ?? <span className="text-navy/25 italic">Not set</span>}
        </p>
      )}
    </div>
  )
}

// ─── Email preferences ────────────────────────────────────────────────────
export function EmailPreferencesSection({
  emailBookingConfirmation,
}: {
  emailBookingConfirmation: boolean
}) {
  const [checked, setChecked] = useState(emailBookingConfirmation)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    const next = !checked
    setChecked(next)
    setSaving(true)
    setError(null)
    const result = await updateEmailPreferencesAction({ email_booking_confirmation: next })
    setSaving(false)
    if (result.error) {
      setChecked(!next)
      setError(result.error)
    }
  }

  return (
    <div className="bg-white border border-cream-mid">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-cream-mid">
        <span className="text-gold/70 text-sm leading-none">◈</span>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-navy/60">
          Preferences
        </p>
      </div>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm font-light text-navy-dark">
              Booking confirmations
            </p>
            <p className="font-mono text-[10px] text-navy/35 mt-0.5 tracking-[0.08em]">
              Receive an email when you book a bay
            </p>
          </div>
          <button
            role="switch"
            aria-checked={checked}
            onClick={handleToggle}
            disabled={saving}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              checked ? 'bg-navy' : 'bg-cream-mid',
            ].join(' ')}
          >
            <span
              className={[
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                checked ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
        {error && (
          <p className="font-mono text-[10px] text-red-500 mt-3">{error}</p>
        )}
      </div>
    </div>
  )
}
