import * as React from "react";

export default function ConfirmEmail({ confirmUrl }: { confirmUrl: string }) {
  // Ensure the URL is absolute and sanitized
  const safeUrl = confirmUrl.startsWith("http")
    ? confirmUrl
    : `https://${confirmUrl.replace(/^\/+/, "")}`;

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto",
        lineHeight: 1.5,
      }}
    >
      <h2 style={{ margin: "0 0 8px" }}>Confirm your email</h2>
      <p style={{ margin: "0 0 16px" }}>
        Tap the button below to confirm your email with The Kandid Edit.
      </p>

      <p>
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            borderRadius: 8,
            textDecoration: "none",
            border: "1px solid #000",
            backgroundColor: "#000",
            color: "#fff",
          }}
        >
          Confirm Email
        </a>
      </p>

      <p style={{ color: "#555", fontSize: 14, marginTop: 24 }}>
        If the button doesn’t work, copy and paste this link into your browser:
        <br />
        <a href={safeUrl} target="_blank" rel="noopener noreferrer">
          {safeUrl}
        </a>
      </p>

      <p style={{ color: "#777", fontSize: 13, marginTop: 16 }}>
        If you didn’t request this, you can ignore this email.
      </p>
    </div>
  );
}