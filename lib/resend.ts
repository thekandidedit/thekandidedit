// lib/resend.ts
import { Resend } from "resend";

/**
 * Strongly-typed input your code can use safely.
 */
export type SendMailOpts = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  /** If omitted, we'll use DEFAULT_FROM */
  from?: string;
  /** If provided, we emit proper List-Unsubscribe + One-Click headers */
  unsubscribeUrl?: string;
  /** Any extra headers you want to pass through */
  headers?: Record<string, string>;
};

/**
 * Single Resend client for the app.
 * (Safe even if the key is missing locally; calls will then fail at runtime.)
 */
export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Default "From" address. Prefer EMAIL_FROM; fall back to RESEND_FROM; else a safe placeholder.
 * Must be the format:  Name <email@domain>
 */
const DEFAULT_FROM =
  (process.env.EMAIL_FROM || process.env.RESEND_FROM || "").trim() ||
  `"The Kandid Edit" <onboarding@resend.dev>`;

/**
 * Helper so routes/components can use the same logic without duplicating.
 */
export const fromAddress = (): string => DEFAULT_FROM;

/**
 * Send an email via Resend with strict, SDK-compatible typing.
 * Ensures `text` is always a string (SDK requires it even when `html` is present).
 */
export async function sendMail(opts: SendMailOpts) {
  const from = (opts.from ?? DEFAULT_FROM).trim();

  // Build RFC-compliant List-Unsubscribe headers (RFC 2369 + RFC 8058) when we have a URL.
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.unsubscribeUrl) {
    // Support both mailto and One-Click POST target
    const mailto = `mailto:unsubscribe@thekandidedit.com`;
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>, <${mailto}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  // Construct payload using the official param type so TS stays happy.
  // `text` must always be a string (not undefined).
  const payload: Parameters<typeof resend.emails.send>[0] = {
    from,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,              // may be undefined (OK)
    text: opts.text ?? "",        // must be string
    ...(Object.keys(headers).length ? { headers } : {}),
  };

  return resend.emails.send(payload);
}