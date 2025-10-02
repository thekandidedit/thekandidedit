// app/page.tsx
"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setConfirmUrl(null);
    setLoading(true);

    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();

      if (!r.ok || data.ok === false) {
        setMsg(data?.error ?? "Something went wrong.");
      } else {
        setMsg("Success! We sent a confirmation email.");
        setConfirmUrl(data.confirmUrl ?? null); // handy for testing
        setEmail("");
      }
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 text-white" style={{ background: "#0b0b0b", minHeight: "100vh" }}>
      <h1 className="text-3xl font-bold mb-6">The Kandid Edit</h1>

      <form onSubmit={subscribe} className="flex gap-2 mb-4">
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
          disabled={loading}
          type="submit"
        >
          {loading ? "Sending..." : "Subscribe"}
        </button>
      </form>

      {msg && <p className="mb-2">{msg}</p>}
      {confirmUrl && (
        <p className="text-sm opacity-70">
          (For testing) Confirm link:{" "}
          <a className="underline" href={confirmUrl}>
            {confirmUrl}
          </a>
        </p>
      )}

      <p className="mt-10 text-sm opacity-70">
        Already subscribed and want to leave?{" "}
        <a className="underline" href="/unsubscribe">
          Unsubscribe here
        </a>
        .
      </p>
    </main>
  );
}