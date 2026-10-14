'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { track } from '@/lib/track';
import { VOLUNTEER_LIMITS, VOLUNTEER_RETENTION_MONTHS, VOLUNTEER_ROLES, type VolunteerRole } from '@/lib/volunteer';

/** The "Help test Stella" sign-up on /help. Sends to /api/volunteer. Adults only. */
export default function HelpForm() {
  const openedAt = useRef(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<VolunteerRole | ''>('');
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');
  const [adult, setAdult] = useState(false);
  const [website, setWebsite] = useState(''); // hidden from people; bots fill it in
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role) {
      setState('error');
      setError('Please give your name, email address and role.');
      return;
    }
    if (!adult) {
      setState('error');
      setError('Please confirm you are 18 or over and happy to be contacted.');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, subject, note, adult, website, elapsed: Date.now() - openedAt.current }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setState('sent');
      track('volunteer_signup', { role });
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (state === 'sent') {
    return (
      <p className="rounded-2xl border border-[var(--rule)] bg-[var(--paper)] p-5 text-[1.0625rem] leading-relaxed text-[var(--ink)]" role="status" data-testid="help-sent">
        Thank you, {name.trim().split(/\s+/)[0]}. You&rsquo;re on the list, and we&rsquo;ll be in touch when the next round of testing starts.
      </p>
    );
  }

  const field = 'mt-1 w-full rounded-xl border border-[var(--rule)] bg-[var(--paper)] min-h-[42px] px-3 py-2 leading-normal text-[var(--ink)]';
  const linkClass = 'font-semibold text-[var(--action)] underline decoration-2 underline-offset-4 hover:text-[var(--action-hover)]';

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="help-form" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[var(--ink)]">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={VOLUNTEER_LIMITS.name} autoComplete="name" required className={field} />
        </label>
        <label className="block text-[var(--ink)]">
          Email address
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={VOLUNTEER_LIMITS.email} autoComplete="email" required className={field} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[var(--ink)]">
          You are a…
          <select value={role} onChange={(e) => setRole(e.target.value as VolunteerRole | '')} required className={field}>
            <option value="">Choose one</option>
            {Object.entries(VOLUNTEER_ROLES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block text-[var(--ink)]">
          Subject or key stage <span className="text-[var(--ink-soft)]">(optional)</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={VOLUNTEER_LIMITS.subject} placeholder="For example: GCSE physics" className={field} />
        </label>
      </div>
      <label className="block text-[var(--ink)]">
        Anything you&rsquo;d like us to know <span className="text-[var(--ink-soft)]">(optional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={VOLUNTEER_LIMITS.note} rows={3} className={field} />
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-[var(--ink)]">
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1.5 h-5 w-5 shrink-0 accent-[var(--action)]" />
        <span>I&rsquo;m 18 or over and happy to be contacted about testing Stella Academy.</span>
      </label>
      <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
        We use your details only to contact you about testing, never for marketing, and delete them after {VOLUNTEER_RETENTION_MONTHS} months, or
        sooner if you ask.{' '}
        <Link href="/privacy#helpers" className={linkClass}>
          Privacy
        </Link>
      </p>
      {state === 'error' && <p className="text-[var(--ink)]" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="rounded-full bg-[var(--action)] px-6 py-2.5 font-semibold text-[var(--on-action)] hover:bg-[var(--action-hover)] disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Count me in'}
      </button>
    </form>
  );
}
