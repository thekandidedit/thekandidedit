// app/auth/confirm/page.tsx

interface ConfirmPageProps {
  searchParams?: Promise<{ status?: string; email?: string }>;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = (await searchParams) || {};
  const status = params.status ?? "ok";
  const email = params.email;

  const title =
    status === "ok"
      ? "✅ Your email has been confirmed!"
      : "⚠️ Confirmation failed";

  const desc =
    status === "ok"
      ? `Thanks${email ? `, ${email}` : ""}. You can safely close this tab.`
      : "The link may be invalid or expired. Please request a new confirmation email.";

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: "12px",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", fontWeight: "600" }}>{title}</h1>
      <p style={{ fontSize: "1rem", color: "#555" }}>{desc}</p>
    </main>
  );
}