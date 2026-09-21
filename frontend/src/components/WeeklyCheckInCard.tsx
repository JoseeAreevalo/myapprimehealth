import { useState } from 'react';
import { Moon } from 'lucide-react';
import { useCheckIns } from '../hooks/useCheckIns';
import CheckInPhotos from './CheckInPhotos';

export default function WeeklyCheckInCard() {
  const { latest, loading, error, submit, isClient } = useCheckIns();
  const [weightKg, setWeightKg] = useState('');
  const [adherencePercent, setAdherencePercent] = useState('80');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!isClient) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      await submit({
        weightKg: weightKg ? Number(weightKg) : null,
        adherencePercent: adherencePercent ? Number(adherencePercent) : null,
        notes: notes || null,
      });
      setFeedback('Check-in submitted for this week.');
      setNotes('');
    } catch {
      setFeedback('Unable to submit your check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/8 bg-panel/70 p-6 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Weekly check-in</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-slate-50">Your progress story</h2>
        </div>
        <Moon className="text-violet-300" size={20} />
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-6 text-sm text-rose-300">{error}</p>}

      {!loading && !error && (
        <>
          {latest ? (
            <div className="mt-6 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-slate-300">
                Week of <span className="font-medium text-slate-100">{latest.weekStartDate}</span> · {latest.status === 'reviewed' ? 'Reviewed by your coach' : 'Awaiting review'}
              </p>
              {latest.coachFeedback && <p className="mt-2 text-sm text-violet-200">"{latest.coachFeedback}"</p>}
              <CheckInPhotos canUpload checkInId={latest.id} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">No check-in submitted yet this week.</p>
          )}

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                onChange={(event) => setWeightKg(event.target.value)}
                placeholder="Weight (kg)"
                type="number"
                value={weightKg}
              />
              <input
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                onChange={(event) => setAdherencePercent(event.target.value)}
                placeholder="Adherence %"
                type="number"
                value={adherencePercent}
              />
            </div>
            <textarea
              className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="How did this week go?"
              rows={2}
              value={notes}
            />
            {feedback && <p className="text-xs text-violet-300">{feedback}</p>}
            <button
              className="w-full rounded-xl bg-white/7 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/12 disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Submitting…' : 'Submit this week\u2019s check-in'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
