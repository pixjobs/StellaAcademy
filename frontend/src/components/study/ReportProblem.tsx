'use client';

import { useState, type FormEvent } from 'react';
import { REPORT_KINDS, REPORT_RETENTION_DAYS, type ReportKind } from '@/lib/report';
import { track } from '@/lib/track';

/** "Report a problem" at the foot of a lesson. Sends to /api/report; no name or email is asked for. */
export default function ReportProblem({ lesson }: { lesson: string }) {
  const [kind, setKind] = useState<ReportKind | ''>('');
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!kind || !text.trim()) {
      setState('error');
      setError('Choose what kind of problem it is and describe it.');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson, kind, text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setState('sent');
      track('report_problem', { lesson, kind });
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const field = 'mt-1 w-full rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-3 text-[var(--ink)]';

  return (
    <details className="rounded-2xl border border-[var(--rule)] bg-[var(--sheet)] p-5" data-testid="report-problem">
      <summary className="cursor-pointer font-semibold text-[var(--action)] hover:text-[var(--action-hover)]">
        Spotted a mistake? Report a problem
      </summary>
      {state === 'sent' ? (
        <p className="mt-4 leading-relaxed text-[var(--ink)]" role="status">
          Thank you. Your report has been sent and will be checked.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
            Please do not include your name, email or anything else about yourself. We only need to know what is wrong.
            We use reports only to put mistakes right, and delete them after {REPORT_RETENTION_DAYS} days.
          </p>
          <label className="block text-[var(--ink)]">
            What kind of problem is it?
            <select value={kind} onChange={(e) => setKind(e.target.value as ReportKind | '')} className={field} required>
              <option value="">Choose one</option>
              {Object.entries(REPORT_KINDS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block text-[var(--ink)]">
            What is wrong?
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={4}
              required
              className={field}
              placeholder="For example: the answer to practice question 3 should be 12, not 14."
            />
          </label>
          {state === 'error' && <p className="text-[var(--ink)]" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={state === 'sending'}
            className="rounded-full bg-[var(--action)] px-5 py-2 font-semibold text-[var(--on-action)] hover:bg-[var(--action-hover)] disabled:opacity-60"
          >
            {state === 'sending' ? 'Sending…' : 'Send report'}
          </button>
        </form>
      )}
    </details>
  );
}
