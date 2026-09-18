/**
 * Member session.
 *
 * The API access token never lands in a JS-readable cookie: the Next server
 * signs it into an HTTP-only cookie and forwards it server-side for REST calls.
 * The one exception is the browser Socket.IO connection, which has to
 * authenticate from the client.
 */
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "jivora_session";
const SECRET = process.env.JIVORA_SESSION_SECRET || "jivora-session-dev";

type SessionPayload = {
  token: string;
  role: "customer" | "practitioner" | "ambassador";
  userId: number;
};

function sign(value: string): string {
  return crypto.createHmac("sha1", SECRET).update(value).digest("hex");
}

export function createSessionCookie(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  const value = `${body}.${sign(body)}`;

  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function readSession(): SessionPayload | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;
  if (signature !== sign(body)) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** Gates a server component on a session, and optionally on a role. */
export function requireAuthenticatedUser(role?: SessionPayload["role"]): SessionPayload {
  const session = readSession();
  if (!session) redirect("/auth/login");
  if (role && session.role !== role) redirect("/dashboard");
  return session;
}
