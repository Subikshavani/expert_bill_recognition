const API_BASE = "/api";

/**
 * Wraps fetch with JSON/FormData handling and error normalization.
 * @param {string} path - path starting with /
 * @param {RequestInit & { body?: object | FormData }} [options]
 */
export async function apiFetch(path, { body, ...rest } = {}) {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: isFormData ? {} : { "Content-Type": "application/json" },
    body: isFormData ? body : body != null ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message;
    try {
      message = JSON.parse(text).error;
    } catch {
      message = text;
    }
    throw new Error(message || `${res.status} ${res.statusText}`);
  }

  return res.json();
}
