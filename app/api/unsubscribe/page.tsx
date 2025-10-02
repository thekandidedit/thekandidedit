// app/unsubscribe/page.tsx
"use client";

import { useState } from "react";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUnsub = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const r = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok || data.ok === false) {
        setMsg(data?.error ?? "Something went wrong.");
      } else {
        setMsg(data?.message ?? "Unsubscribed.");
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
      <h1 className="text-3xl font-bold mb-6">Unsubscribe</h1>

      <form onSubmit={handleUnsub} className="flex gap-2 mb-4">
        <input
          className="border px-3 py-2 rounded w-[320px] text-black"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <button className="px-4 py-2 rounded bg-white text-black disabled:opacity-60" disabled={loading}>
          {loading ? "Sending..." : "Unsubscribe"}
        </button>
      </form>

      {msg && <p>{msg}</p>}

      <p className="mt-6">
        <a className="underline" href="/">
          Return to home →
        </a>
      </p>
    </main>
  );
}