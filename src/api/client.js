const API_BASE = "/api";
const API_TIMEOUT_MS = 10000;

/**
 * Wraps fetch with JSON/FormData handling and error normalization.
 * @param {string} path - path starting with /
 * @param {RequestInit & { body?: object | FormData }} [options]
 */
export async function apiFetch(path, { body, ...rest } = {}) {
  const isFormData = body instanceof FormData;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      body: isFormData ? body : body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...rest,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The server did not respond in time. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

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
