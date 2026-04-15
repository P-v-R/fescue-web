'use client'

import { useState } from 'react'
import { updateSgtUsernameAction } from './actions'

type Props = {
  memberId: string
  sgtUsername: string | null
}

export function SgtUsernameField({ memberId, sgtUsername }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(sgtUsername ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateSgtUsernameAction(memberId, value)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setEditing(false)
    }
  }

  return (
    <div>
      <p className="font-mono text-label uppercase tracking-[0.18em] text-sand mb-0.5">
        SGT Username
      </p>
      {editing ? (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="SGT username"
            className="font-sans text-sm font-light text-navy-dark bg-transparent border-b border-sand pb-0.5 outline-none focus:border-navy transition-colors min-w-0 w-40"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-mono text-label uppercase tracking-[0.15em] text-gold hover:text-navy transition-colors disabled:opacity-40"
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setError(null) }}
            className="font-mono text-label uppercase tracking-[0.15em] text-sand hover:text-navy transition-colors"
          >
            Cancel
          </button>
          {error && <span className="font-mono text-label text-red-500">{error}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-2 group/field">
          <p className="font-sans text-sm font-light text-navy-dark">
            {sgtUsername ?? <span className="text-navy/30 italic">Not set</span>}
          </p>
          <button
            onClick={() => { setValue(sgtUsername ?? ''); setEditing(true) }}
            className="font-mono text-label uppercase tracking-[0.15em] text-sand/0 group-hover/field:text-sand hover:!text-gold transition-colors"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}
