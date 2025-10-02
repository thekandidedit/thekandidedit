// app/confirm/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ConfirmPage() {
  const search = useSearchParams();
  const token = search.get("token");
  const [msg, setMsg] = useState<string>("Confirming your subscription...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setMsg("Missing token.");
        setDone(true);
        return;
      }
      try {
        const r = await fetch(`/api/confirm?token=${encodeURIComponent(token)}`);
        const data = await r.json();
        if (!r.ok || data.ok === false) {
          setMsg(data?.error ?? "Invalid token.");
        } else {
          setMsg("🎉 Subscription confirmed! Welcome.");
        }
      } catch {
        setMsg("Network error. Please try again.");
      } finally {
        setDone(true);
      }
    };
    run();
  }, [token]);

  return (
    <main className="p-8 text-white" style={{ background: "#0b0b0b", minHeight: "100vh" }}>
      <h1 className="text-3xl font-bold mb-6">The Kandid Edit</h1>
      <p>{msg}</p>
      {done && (
        <p className="mt-6">
          <a className="underline" href="/">
            Return to home →
          </a>
        </p>
      )}
    </main>
  );
}