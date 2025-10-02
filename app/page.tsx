"use client";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Sending…");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setMsg("Success! (email sending next). Confirm URL: " + (data.confirmUrl ?? ""));
      setEmail("");
    } catch {
      setMsg("Something went wrong.");
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">The Kandid Edit</h1>
      <form onSubmit={subscribe} className="flex gap-2">
        <input
          className="border px-3 py-2 rounded w-72"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="bg-black text-white px-4 rounded">Subscribe</button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
