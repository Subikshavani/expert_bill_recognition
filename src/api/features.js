import { apiFetch } from "./client";

// ═══════════════════════════════════════════════════════════════════════
// 📋 BILL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export async function createTemplate(payload) {
  return apiFetch("/bill-templates", { method: "POST", body: JSON.stringify(payload) });
}

export async function getTemplates(email) {
  return apiFetch(`/bill-templates?email=${encodeURIComponent(email)}`);
}

export async function deleteTemplate(templateId) {
  return apiFetch(`/bill-templates/${templateId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════════════
// 💰 BUDGET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export async function createBudget(payload) {
  return apiFetch("/budgets", { method: "POST", body: JSON.stringify(payload) });
}

export async function getBudgets(filters) {
  const params = new URLSearchParams(filters);
  return apiFetch(`/budgets?${params.toString()}`);
}

export async function updateBudgetSpent(budgetId, spentAmount) {
  return apiFetch(`/budgets/${budgetId}/update-spent`, {
    method: "PATCH",
    body: JSON.stringify({ spentAmount }),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 🏢 VENDOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export async function createVendor(payload) {
  return apiFetch("/vendors", { method: "POST", body: JSON.stringify(payload) });
}

export async function getVendors(status = null) {
  const url = status ? `/vendors?status=${status}` : "/vendors";
  return apiFetch(url);
}

export async function updateVendorStatus(vendorId, status) {
  return apiFetch(`/vendors/${vendorId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 💬 BILL COMMENTS
// ═══════════════════════════════════════════════════════════════════════

export async function createComment(payload) {
  return apiFetch("/bill-comments", { method: "POST", body: JSON.stringify(payload) });
}

export async function getBillComments(billId) {
  return apiFetch(`/bill-comments/${billId}`);
}

export async function deleteComment(commentId) {
  return apiFetch(`/bill-comments/${commentId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════════════
// 💳 ADVANCE REQUESTS
// ═══════════════════════════════════════════════════════════════════════

export async function createAdvanceRequest(payload) {
  return apiFetch("/advance-requests", { method: "POST", body: JSON.stringify(payload) });
}

export async function getAdvanceRequests(filters) {
  const params = new URLSearchParams(filters);
  return apiFetch(`/advance-requests?${params.toString()}`);
}

export async function approveAdvanceRequest(advanceId, approverEmail, approvalComments) {
  return apiFetch(`/advance-requests/${advanceId}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ approverEmail, approvalComments }),
  });
}

export async function settleAdvanceRequest(advanceId, settlementAmount) {
  return apiFetch(`/advance-requests/${advanceId}/settle`, {
    method: "PATCH",
    body: JSON.stringify({ settlementAmount }),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 📊 TRIP ANALYTICS
// ═══════════════════════════════════════════════════════════════════════

export async function computeTripAnalytics(sessionId) {
  return apiFetch("/trip-analytics/compute", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export async function getTripAnalytics(sessionId) {
  return apiFetch(`/trip-analytics/${sessionId}`);
}

// ═══════════════════════════════════════════════════════════════════════
// 🔐 AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════

export async function createAuditLog(payload) {
  return apiFetch("/audit-logs", { method: "POST", body: JSON.stringify(payload) });
}

export async function getAuditLogs(filters) {
  const params = new URLSearchParams(filters);
  return apiFetch(`/audit-logs?${params.toString()}`);
}

export async function getAuditReport(startDate, endDate, complianceLevel = null) {
  const params = new URLSearchParams({ startDate, endDate });
  if (complianceLevel) params.append("complianceLevel", complianceLevel);
  return apiFetch(`/audit-logs/report?${params.toString()}`);
}
