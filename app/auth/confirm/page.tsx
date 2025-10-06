// app/auth/confirm/page.tsx
type Props = { searchParams: { status?: string; email?: string } };

export default function ConfirmPage({ searchParams }: Props) {
  const status = searchParams.status ?? "ok";
  const email = searchParams.email;

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
        gap: 12,
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1>{title}</h1>
      <p>{desc}</p>
    </main>
  );
}