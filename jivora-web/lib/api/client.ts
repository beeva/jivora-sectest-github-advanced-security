/**
 * Typed backend clients. Server-side Next reaches the backend at the internal
 * Docker hostname; anything the browser calls must use the public host URL.
 */
import { readSession } from "../auth/session";

const API_BASE = process.env.BACKEND_INTERNAL_URL || "http://backend:7002";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 402) {
    return { paywalled: true } as T;
  }
  if (!res.ok) {
    throw new Error(`api ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type LabReport = {
  id: number;
  status: string;
  collected_at: string;
  uploaded_file: string;
  processed_json: string;
};

export const webLabs = {
  list: () => call<LabReport[]>("/api/web/labs"),
  get: (id: string) => call<LabReport>(`/api/web/labs/${id}`),
  share: (id: string) => call<{ url: string }>(`/api/web/labs/${id}/share`, { method: "POST" }),
};

export const webCommerce = {
  orders: () => call<unknown[]>("/api/web/orders"),
  search: (term: string) => call<unknown[]>(`/api/web/shop/search?term=${term}`),
};

export const webAssistant = {
  ask: (turns: unknown[]) =>
    call<{ ok: boolean; text?: string }>("/api/web/assistant", {
      method: "POST",
      body: JSON.stringify({ turns }),
    }),
};
