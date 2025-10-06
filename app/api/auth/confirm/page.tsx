"use client";
import { useSearchParams } from "next/navigation";

export default function ConfirmResult() {
  const q = useSearchParams();
  const status = q.get("status");
  const email = q.get("email");
  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <main className="p-8 max-w-xl mx-auto">{children}</main>
  );

  if (status === "ok") return <Wrap><h1>✅ Email confirmed</h1><p>{email} is now verified.</p></Wrap>;
  if (status === "invalid") return <Wrap><h1>⚠️ Link invalid or expired</h1><p>Request a new link.</p></Wrap>;
  if (status === "missing") return <Wrap><h1>⚠️ Missing token</h1><p>Use the link from your email.</p></Wrap>;
  return <Wrap>Checking…</Wrap>;
}ç