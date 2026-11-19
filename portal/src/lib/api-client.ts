/** Client fetch wrapper: JSON, CSRF header from cookie, throws Error(message) on non-2xx. */
function csrf() {
  return document.cookie.split("; ").find((c) => c.startsWith("ipm_csrf="))?.split("=")[1] ?? "";
}

export async function api<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      "x-csrf-token": csrf(),
      ...rest.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}
