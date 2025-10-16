"use client";

import { useEffect, useState } from "react";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- handle query params from one-click link ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const e = params.get("email");

    if (status === "ok" && e) {
      setMsg(`✅ ${decodeURIComponent(e)} has been unsubscribed.`);
    } else if (status === "invalid") {
      setMsg("⚠️ Invalid or expired unsubscribe link.");
    } else if (status === "error") {
      setMsg("❌ Something went wrong unsubscribing. Please try again below.");
    }
  }, []);

  // --- manual unsubscribe form ---
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setMsg(data?.error ?? `Error ${res.status}`);
        return;
      }
      setMsg("✅ You’ve been unsubscribed. Sorry to see you go!");
      setEmail("");
    } catch {
      setMsg("⚠️ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // --- UI ---
  return (
    <main
      className="p-8 text-white flex flex-col items-center justify-center text-center"
      style={{ background: "#0b0b0b", minHeight: "100vh" }}
    >
      <h1 className="text-3xl font-bold mb-4">Unsubscribe</h1>
      {msg ? (
        <p className="mb-6 text-lg text-gray-300 max-w-md">{msg}</p>
      ) : (
        <p className="mb-6 text-gray-400">
          Enter your email below to unsubscribe from future updates.
        </p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="border border-gray-500 px-3 py-2 rounded text-black w-72 sm:w-80"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          disabled={loading}
        />
        <button
          className="px-4 py-2 rounded bg-white text-black font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Working…" : "Unsubscribe"}
        </button>
      </form>
    </main>
  );
}