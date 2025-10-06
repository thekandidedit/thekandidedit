import * as React from "react";

export default function ConfirmEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto", lineHeight: 1.5 }}>
      <h2 style={{ margin: "0 0 8px" }}>Confirm your email</h2>
      <p style={{ margin: "0 0 16px" }}>
        Tap the button below to confirm your email with The Kandid Edit.
      </p>
      <p>
        <a
          href={confirmUrl}
          style={{
            display: "inline-block",
            padding: "10px 16px",
            borderRadius: 8,
            textDecoration: "none",
            border: "1px solid #000"
          }}
        >
          Confirm Email
        </a>
      </p>
      <p style={{ color: "#555", fontSize: 14, marginTop: 24 }}>
        If you didn’t request this, you can ignore this email.
      </p>
    </div>
  );
}