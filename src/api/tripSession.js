import { apiFetch } from "./client";

/** Fetch the active (or latest) trip session for an employee. */
export async function getActiveSession(email) {
  return apiFetch(`/trip-session?email=${encodeURIComponent(email)}`);
}

/** Fetch full session history for an employee. */
export async function getAllSessions(email) {
  return apiFetch(`/trip-sessions?email=${encodeURIComponent(email)}`);
}

/**
 * Start a new trip session.
 * @param {{ employeeId: string, employeeEmail: string, tripName: string, startDate: string }} payload
 */
export async function startSession(payload) {
  return apiFetch("/trip-session/start", { method: "POST", body: payload });
}

/** End (complete) an active trip session. */
export async function endSession(sessionId) {
  return apiFetch(`/trip-session/${sessionId}/end`, { method: "PATCH" });
}
