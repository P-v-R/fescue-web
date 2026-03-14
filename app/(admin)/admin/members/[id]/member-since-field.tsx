'use client';

import { useState } from 'react';
import { updateMemberSinceAction } from './actions';

type Props = {
  memberId: string;
  memberSince: number | null;
  createdAt: string;
};

export function MemberSinceField({ memberId, memberSince, createdAt }: Props) {
  const currentYear = new Date().getFullYear();
  const displayYear = memberSince ?? new Date(createdAt).getFullYear();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(displayYear));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const year = parseInt(value, 10);
    if (isNaN(year)) return;
    setSaving(true);
    setError(null);
    const result = await updateMemberSinceAction(memberId, year);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditing(false);
    }
  }

  return (
    <div>
      <p className='font-mono text-label uppercase tracking-[0.18em] text-sand mb-0.5'>
        Member Since
      </p>
      {editing ? (
        <div className='flex items-center gap-2'>
          <input
            type='number'
            min={1900}
            max={currentYear}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className='w-24 font-sans text-sm font-light text-navy-dark bg-transparent border-b border-sand pb-0.5 outline-none focus:border-navy transition-colors'
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className='font-mono text-label uppercase tracking-[0.15em] text-gold hover:text-navy transition-colors disabled:opacity-40'
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className='font-mono text-label uppercase tracking-[0.15em] text-sand hover:text-navy transition-colors'
          >
            Cancel
          </button>
          {error && (
            <span className='font-mono text-label text-red-500'>{error}</span>
          )}
        </div>
      ) : (
        <div className='flex items-center gap-2 group/field'>
          <p className='font-sans text-sm font-light text-navy-dark'>
            {displayYear}
            {!memberSince && (
              <span className='text-navy/30 italic text-xs ml-1'>
                (from account)
              </span>
            )}
          </p>
          <button
            onClick={() => {
              setValue(String(displayYear));
              setEditing(true);
            }}
            className='font-mono text-label uppercase tracking-[0.15em] text-sand/0 group-hover/field:text-sand hover:!text-gold transition-colors'
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
