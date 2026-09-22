/**
 * Tiny client-side API helpers for components.
 * Returns parsed JSON or throws an Error with the server's error message.
 */

/**
 * Turns an error body into something a person can act on.
 *
 * The API returns `{ error, issues }` for validation failures, where
 * `issues` names the offending field. Showing only `error` surfaced a
 * bare "Invalid input" with no clue which field was wrong, so fold the
 * field messages in.
 */
function errorMessage(body: unknown, status: number): string {
  const b = body as {
    error?: string;
    issues?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
  };
  const base = b?.error ?? `Request failed (${status})`;
  const fieldErrors = b?.issues?.fieldErrors;
  if (fieldErrors) {
    const detail = Object.entries(fieldErrors)
      .map(([field, msgs]) => `${field}: ${(msgs ?? []).join(", ")}`)
      .filter((d) => !d.endsWith(": "))
      .join("; ");
    if (detail) return `${base} — ${detail}`;
  }
  const formErrors = b?.issues?.formErrors;
  if (formErrors?.length) return `${base} — ${formErrors.join("; ")}`;
  return base;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(errorMessage(body, res.status));
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(errorMessage(data, res.status));
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(errorMessage(data, res.status));
  }
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(errorMessage(data, res.status));
  }
  return res.json() as Promise<T>;
}
