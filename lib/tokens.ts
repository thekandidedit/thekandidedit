/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";

const TTL_MIN = 30;

export function signEmailToken(payload: { email: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.sign(payload, secret, { expiresIn: `${TTL_MIN}m` });
}

export function verifyEmailToken(token: string): { email: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return jwt.verify(token, secret) as any;
}