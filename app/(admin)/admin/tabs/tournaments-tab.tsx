'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type {
  Tournament,
  TournamentFormat,
  TournamentRegistrationWithMember,
  Member,
} from '@/lib/supabase/types';
import { useActionState } from '../hooks/use-action-state';
import {
  AdminSection,
  StatusMessage,
  ConfirmButton,
  FieldLabel,
  inputCls,
  selectCls,
  AdminEmpty,
} from '../components/admin-ui';
import {
  createTournamentAction,
  updateTournamentAction,
  deleteTournamentAction,
  openRegistrationAction,
  closeRegistrationAction,
  addParticipantAction,
  removeParticipantAction,
  setSeedsAction,
  generateBracketAction,
  resetBracketAction,
} from '../actions';

type RunFn = (action: () => Promise<{ error?: string; success?: string }>) => void;

function seedSort(a: TournamentRegistrationWithMember, b: TournamentRegistrationWithMember): number {
  if (a.seed != null && b.seed != null) return a.seed - b.seed;
  if (a.seed != null) return -1;
  if (b.seed != null) return 1;
  return a.created_at.localeCompare(b.created_at);
}

// Reorderable seed list shown while a tournament is in the 'seeding' state.
function SeedingPanel({
  tournamentId,
  regs,
  isPending,
  run,
}: {
  tournamentId: string;
  regs: TournamentRegistrationWithMember[];
  isPending: boolean;
  run: RunFn;
}) {
  const [order, setOrder] = useState<TournamentRegistrationWithMember[]>(() => [...regs].sort(seedSort));

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  return (
    <div className='space-y-3'>
      <p className='font-mono text-[10px] uppercase tracking-[0.18em] text-navy/40'>
        Seeding — order players, then draw the bracket. Top seeds receive byes when the field isn&apos;t a power of two.
      </p>
      <div className='space-y-1.5'>
        {order.map((r, i) => (
          <div key={r.id} className='flex items-center gap-3 bg-cream/40 border border-cream-mid px-3 py-2'>
            <span className='font-mono text-[10px] text-gold w-6'>{String(i + 1).padStart(2, '0')}</span>
            <span className='font-serif text-sm font-light text-navy flex-1 truncate'>
              {r.members?.full_name ?? 'Unknown'}
            </span>
            {!r.members?.sgt_username && (
              <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-gold bg-gold/10 px-2 py-0.5'>
                No SGT username
              </span>
            )}
            <div className='flex gap-1'>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className='font-mono text-xs text-navy/50 hover:text-navy disabled:opacity-20 px-1'
                aria-label='Move up'
              >
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                className='font-mono text-xs text-navy/50 hover:text-navy disabled:opacity-20 px-1'
                aria-label='Move down'
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className='flex gap-3 flex-wrap'>
        <button
          onClick={() => run(() => setSeedsAction(tournamentId, order.map((r) => r.id)))}
          disabled={isPending}
          className='border border-cream-mid text-navy/60 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 hover:border-navy/30 hover:text-navy transition-colors disabled:opacity-40'
        >
          Save Order
        </button>
        <ConfirmButton
          disabled={isPending || order.length < 2}
          onConfirm={() => run(() => generateBracketAction(tournamentId))}
          label='Draw Bracket →'
          confirmLabel='Yes, Draw'
          confirmMessage='Draw the bracket and start play? This saves the current order.'
          variant='primary'
        />
      </div>
    </div>
  );
}

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elim: 'Single elimination',
  double_elim: 'Double elimination',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'text-navy/40 bg-cream-mid',
  registration: 'text-sage bg-sage/10',
  seeding: 'text-gold bg-gold/10',
  in_progress: 'text-white bg-navy',
  completed: 'text-navy/50 bg-cream',
  cancelled: 'text-red-400 bg-red-50',
};

// Converts an ISO string to the value a datetime-local input expects, in local time.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TournamentsTab({
  tournaments,
  registrations,
  members,
}: {
  tournaments: Tournament[];
  registrations: TournamentRegistrationWithMember[];
  members: Member[];
}) {
  const { message, isPending, run } = useActionState();
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addSelection, setAddSelection] = useState<Record<string, string>>({});

  const registrationsByTournament = useMemo(() => {
    const map: Record<string, TournamentRegistrationWithMember[]> = {};
    for (const r of registrations) {
      (map[r.tournament_id] ??= []).push(r);
    }
    return map;
  }, [registrations]);

  const activeMembers = useMemo(
    () => members.filter((m) => m.is_active).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [members],
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tFormat, setTFormat] = useState<TournamentFormat>('single_elim');
  const [capacity, setCapacity] = useState('');
  const [registrationCloses, setRegistrationCloses] = useState('');
  const [startsAt, setStartsAt] = useState('');

  function resetForm() {
    setName(''); setDescription(''); setTFormat('single_elim');
    setCapacity(''); setRegistrationCloses(''); setStartsAt('');
    setEditing(null);
  }

  function startEdit(t: Tournament) {
    setEditing(t);
    setName(t.name);
    setDescription(t.description ?? '');
    setTFormat(t.format);
    setCapacity(t.capacity != null ? String(t.capacity) : '');
    setRegistrationCloses(toLocalInput(t.registration_closes_at));
    setStartsAt(toLocalInput(t.starts_at));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('name', name);
    fd.set('description', description);
    fd.set('format', tFormat);
    fd.set('capacity', capacity);
    fd.set('registration_closes_at', registrationCloses);
    fd.set('starts_at', startsAt);
    run(async () => {
      const result = editing
        ? await updateTournamentAction(editing.id, fd)
        : await createTournamentAction(fd);
      if (!result.error) resetForm();
      return result;
    });
  }

  return (
    <div className='space-y-6'>
      <StatusMessage message={message} />

      {/* Create / Edit form */}
      <AdminSection
        icon='🏆'
        title={editing ? `Edit: ${editing.name}` : 'Create Match Play Tournament'}
        help='Tournaments start as a draft. Open registration when you are ready for members to sign up.'
      >
        <form onSubmit={handleSubmit} className='space-y-5 max-w-lg'>
          <div>
            <FieldLabel required>Name</FieldLabel>
            <input
              type='text'
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              placeholder='Club Match Play Championship'
              className={inputCls}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <FieldLabel required>Format</FieldLabel>
              <select
                value={tFormat}
                onChange={(e) => setTFormat(e.target.value as TournamentFormat)}
                className={selectCls + ' w-full'}
              >
                <option value='single_elim'>Single elimination</option>
                <option value='double_elim'>Double elimination</option>
              </select>
            </div>
            <div>
              <FieldLabel help='Maximum number of players. Leave blank for unlimited.'>
                Capacity <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
              </FieldLabel>
              <input
                type='number'
                min={2}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder='Unlimited'
                className={inputCls}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <FieldLabel>
                Registration closes <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
              </FieldLabel>
              <input
                type='datetime-local'
                value={registrationCloses}
                onChange={(e) => setRegistrationCloses(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>
                Starts <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
              </FieldLabel>
              <input
                type='datetime-local'
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <FieldLabel>
              Description <span className='normal-case font-sans text-[10px] text-navy/30'>(optional)</span>
            </FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder='Format details, schedule, prizes…'
              className={inputCls + ' resize-none'}
            />
          </div>

          <div className='flex gap-3'>
            <button
              type='submit'
              disabled={isPending || !name}
              className='bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[inset_0_-2px_0_0_rgba(184,150,60,0.4)] hover:opacity-90 transition-opacity disabled:opacity-50'
            >
              {isPending ? 'Saving…' : editing ? 'Save Changes →' : 'Create Tournament →'}
            </button>
            {editing && (
              <button
                type='button'
                onClick={resetForm}
                className='border border-cream-mid text-navy/50 font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 hover:border-navy/30 hover:text-navy transition-colors'
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </AdminSection>

      {/* Tournament list */}
      <AdminSection icon='📋' title={`Tournaments (${tournaments.length})`}>
        {tournaments.length === 0 ? (
          <AdminEmpty text='No tournaments yet. Create one above.' />
        ) : (
          <div className='space-y-3'>
            {tournaments.map((t) => {
              const regs = registrationsByTournament[t.id] ?? [];
              const isExpanded = expandedId === t.id;
              const registeredIds = new Set(regs.map((r) => r.member_id));
              const addableMembers = activeMembers.filter((m) => !registeredIds.has(m.id));
              const isFull = t.capacity != null && regs.length >= t.capacity;
              const canEditField = t.status === 'draft' || t.status === 'registration' || t.status === 'seeding';

              return (
                <div key={t.id} className='border border-cream-mid bg-white'>
                  <div className='px-4 sm:px-5 py-4 flex items-start gap-4'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='font-serif text-sm text-navy font-light'>{t.name}</p>
                        <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 ${STATUS_STYLES[t.status] ?? 'text-navy/40 bg-cream-mid'}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className='font-mono text-[10px] text-navy/40 mt-1 tracking-[0.08em]'>
                        {FORMAT_LABELS[t.format]}
                        {` · ${regs.length}${t.capacity != null ? `/${t.capacity}` : ''} players`}
                        {t.starts_at && ` · starts ${format(new Date(t.starts_at), 'MMM d, h:mm a')}`}
                      </p>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className='font-mono text-[10px] uppercase tracking-[0.12em] text-sage hover:text-navy transition-colors mt-1.5'
                      >
                        {isExpanded ? 'Hide field ▴' : 'Manage field ▾'}
                      </button>
                    </div>

                    <div className='flex gap-3 flex-shrink-0 items-center flex-wrap justify-end'>
                      <button
                        onClick={() => startEdit(t)}
                        className='font-mono text-[10px] uppercase tracking-[0.15em] text-gold hover:text-navy transition-colors'
                      >
                        Edit
                      </button>
                      {t.status === 'draft' && (
                        <button
                          onClick={() => run(() => openRegistrationAction(t.id))}
                          disabled={isPending}
                          className='font-mono text-[10px] uppercase tracking-[0.15em] text-sage hover:text-navy transition-colors disabled:opacity-40'
                        >
                          Open Registration
                        </button>
                      )}
                      {t.status === 'registration' && (
                        <ConfirmButton
                          disabled={isPending}
                          onConfirm={() => run(() => closeRegistrationAction(t.id))}
                          label='Close Registration'
                          confirmLabel='Yes, Close'
                          confirmMessage='Close sign-ups and move to seeding?'
                          variant='primary'
                        />
                      )}
                      <ConfirmButton
                        disabled={isPending}
                        onConfirm={() => run(() => deleteTournamentAction(t.id))}
                        label='Delete'
                        confirmLabel='Yes, Delete'
                        confirmMessage='Delete this tournament and all registrations?'
                        variant='danger'
                      />
                    </div>
                  </div>

                  {/* Field / roster management */}
                  {isExpanded && (
                    <div className='border-t border-cream-mid px-4 sm:px-5 py-4 space-y-4'>
                      {canEditField && (
                        <>
                          {/* Add participant */}
                          <div className='flex items-end gap-3 flex-wrap'>
                            <div className='flex-1 min-w-[200px]'>
                              <FieldLabel>Add a member</FieldLabel>
                              <select
                                value={addSelection[t.id] ?? ''}
                                onChange={(e) => setAddSelection((s) => ({ ...s, [t.id]: e.target.value }))}
                                disabled={isFull || addableMembers.length === 0}
                                className={selectCls + ' w-full'}
                              >
                                <option value=''>
                                  {isFull ? '— tournament full —' : addableMembers.length === 0 ? '— everyone is registered —' : '— select member —'}
                                </option>
                                {addableMembers.map((m) => (
                                  <option key={m.id} value={m.id}>{m.full_name}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                const memberId = addSelection[t.id];
                                if (!memberId) return;
                                run(async () => {
                                  const result = await addParticipantAction(t.id, memberId);
                                  if (!result.error) setAddSelection((s) => ({ ...s, [t.id]: '' }));
                                  return result;
                                });
                              }}
                              disabled={isPending || isFull || !addSelection[t.id]}
                              className='bg-navy text-cream font-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40'
                            >
                              Add
                            </button>
                          </div>

                          {/* Roster */}
                          {regs.length === 0 ? (
                            <p className='font-mono text-[10px] text-navy/30 uppercase tracking-[0.15em]'>No players registered.</p>
                          ) : (
                            <div className='space-y-2'>
                              {[...regs].sort(seedSort).map((r, i) => (
                                <div key={r.id} className='flex items-center justify-between gap-4'>
                                  <div className='flex items-center gap-3 min-w-0'>
                                    <span className='font-mono text-[10px] text-navy/30 w-6'>{String(i + 1).padStart(2, '0')}</span>
                                    <span className='font-serif text-sm font-light text-navy truncate'>
                                      {r.members?.full_name ?? 'Unknown'}
                                    </span>
                                    {!r.members?.sgt_username && (
                                      <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-gold bg-gold/10 px-2 py-0.5 shrink-0'>
                                        No SGT username
                                      </span>
                                    )}
                                  </div>
                                  <ConfirmButton
                                    disabled={isPending}
                                    onConfirm={() => run(() => removeParticipantAction(r.id, t.id))}
                                    label='Remove'
                                    confirmLabel='Yes, Remove'
                                    confirmMessage='Remove this player from the field?'
                                    variant='danger'
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Seeding + draw */}
                      {t.status === 'seeding' && (
                        <div className='pt-2 border-t border-cream-mid'>
                          <SeedingPanel tournamentId={t.id} regs={regs} isPending={isPending} run={run} />
                        </div>
                      )}

                      {/* Bracket controls once play has started */}
                      {(t.status === 'in_progress' || t.status === 'completed') && (
                        <div className='flex items-center gap-3 flex-wrap'>
                          <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-navy/40 flex-1'>
                            Bracket drawn · {regs.length} players. Manage matches on the tournament page.
                          </p>
                          <ConfirmButton
                            disabled={isPending}
                            onConfirm={() => run(() => resetBracketAction(t.id))}
                            label='Reset Bracket'
                            confirmLabel='Yes, Reset'
                            confirmMessage='Clear the bracket and return to seeding?'
                            variant='danger'
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
