'use client';

import { useCallback, useMemo, useState } from 'react';

type SubscribeResponse =
  | { ok: true; confirmUrl?: string; confirm_url?: string }
  | { ok: false; error?: string };

export default function Home() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return /\S+@\S+\.\S+/.test(email) && !loading;
  }, [email, loading]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setLoading(true);
      setMessage(null);
      setConfirmUrl(null);

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });

        const data = (await res.json()) as SubscribeResponse;

        if (!res.ok || data.ok === false) {
          setMessage(data?.error ?? `Error ${res.status}`);
          return;
        }

        const url = data.confirmUrl ?? data.confirm_url ?? null;

        setMessage('Success! We sent a confirmation email.');
        setConfirmUrl(url);
        setEmail('');
      } catch {
        setMessage('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [canSubmit, email]
  );

  return (
    <main
      className="p-8 text-white"
      style={{ background: '#0b0b0b', minHeight: '100vh' }}
    >
      <h1 className="text-3xl font-bold mb-6">The Kandid Edit</h1>

      <form onSubmit={onSubmit} className="flex gap-2 mb-4">
        <input
          className="border px-3 py-2 rounded w-[320px] text-black"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <button
          className="px-4 py-2 rounded bg-white text-black disabled:opacity-60"
          disabled={!canSubmit}
          type="submit"
        >
          {loading ? 'Sending…' : 'Subscribe'}
        </button>
      </form>

      {message && <p className="mb-2">{message}</p>}

      {confirmUrl && (
        <p className="text-sm opacity-70 break-all">
          (For testing) Confirm link:{' '}
          <a
            className="underline"
            href={confirmUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {confirmUrl}
          </a>
        </p>
      )}

      <p className="mt-10 text-sm opacity-70">
        Already subscribed and want to leave?{' '}
        <a className="underline" href="/unsubscribe">
          Unsubscribe here
        </a>
        .
      </p>
    </main>
  );
}