import { apiFetch } from './client.js';

// ═══════════════════════════════════════════════════════════════════════
// 📋 BILL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export async function createTemplate(payload) {
  if (!payload.employeeEmail) throw new Error("Email is required");
  return apiFetch("/bill-templates", { method: "POST", body: JSON.stringify(payload) });
}

export async function getTemplates(email) {
  if (!email) throw new Error("Email is required");
  return apiFetch(`/bill-templates?email=${encodeURIComponent(email)}`);
}

export async function deleteTemplate(templateId) {
  if (!templateId) throw new Error("Template ID is required");
  return apiFetch(`/bill-templates/${templateId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════════════
// 💰 BUDGET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export async function createBudget(payload) {
  if (!payload.department || !payload.monthlyLimit) throw new Error("Required fields missing");
  return apiFetch("/budgets", { method: "POST", body: JSON.stringify(payload) });
}

export async function getBudgets(filters) {
  if (!filters || !filters.email) throw new Error("Email is required");
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, v);
  });
  return apiFetch(`/budgets?${params.toString()}`);
}

export async function updateBudgetSpent(budgetId, spentAmount) {
  if (!budgetId) throw new Error("Budget ID is required");
  return apiFetch(`/budgets/${budgetId}/update-spent`, {
    method: "PATCH",
    body: JSON.stringify({ spentAmount }),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 🏢 VENDOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export async function createVendor(payload) {
  if (!payload.vendorName) throw new Error("Vendor name is required");
  return apiFetch("/vendors", { method: "POST", body: JSON.stringify(payload) });
}

export async function getVendors(status = null) {
  const url = status ? `/vendors?status=${status}` : "/vendors";
  return apiFetch(url);
}

export async function updateVendorStatus(vendorId, status) {
  if (!vendorId || !status) throw new Error("Vendor ID and status are required");
  return apiFetch(`/vendors/${vendorId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 💬 BILL COMMENTS
// ═══════════════════════════════════════════════════════════════════════

export async function createComment(payload) {
  if (!payload.billId || !payload.authorEmail || !payload.comment) {
    throw new Error("Bill ID, author email, and comment are required");
  }
  return apiFetch("/bill-comments", { method: "POST", body: JSON.stringify(payload) });
}

export async function getBillComments(billId) {
  if (!billId) throw new Error("Bill ID is required");
  return apiFetch(`/bill-comments/${billId}`);
}

export async function deleteComment(commentId) {
  if (!commentId) throw new Error("Comment ID is required");
  return apiFetch(`/bill-comments/${commentId}`, { method: "DELETE" });
}

// ═══════════════════════════════════════════════════════════════════════
// 💳 ADVANCE REQUESTS
// ═══════════════════════════════════════════════════════════════════════

export async function createAdvanceRequest(payload) {
  if (!payload.employeeEmail || !payload.amount || !payload.purpose) {
    throw new Error("Employee email, amount, and purpose are required");
  }
  return apiFetch("/advance-requests", { method: "POST", body: JSON.stringify(payload) });
}

export async function getAdvanceRequests(filters) {
  if (!filters || !filters.email) throw new Error("Email is required");
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, v);
  });
  return apiFetch(`/advance-requests?${params.toString()}`);
}

export async function approveAdvanceRequest(advanceId, approverEmail, approvalComments) {
  if (!advanceId || !approverEmail) throw new Error("Advance ID and approver email are required");
  return apiFetch(`/advance-requests/${advanceId}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ approverEmail, approvalComments }),
  });
}

export async function settleAdvanceRequest(advanceId, settlementAmount) {
  if (!advanceId) throw new Error("Advance ID is required");
  return apiFetch(`/advance-requests/${advanceId}/settle`, {
    method: "PATCH",
    body: JSON.stringify({ settlementAmount }),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 📊 TRIP ANALYTICS
// ═══════════════════════════════════════════════════════════════════════

export async function computeTripAnalytics(sessionId) {
  if (!sessionId) throw new Error("Session ID is required");
  return apiFetch("/trip-analytics/compute", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export async function getTripAnalytics(sessionId) {
  if (!sessionId) throw new Error("Session ID is required");
  return apiFetch(`/trip-analytics/${sessionId}`);
}

// ═══════════════════════════════════════════════════════════════════════
// 🔐 AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════

export async function createAuditLog(payload) {
  if (!payload.userEmail || !payload.action || !payload.entityType) {
    throw new Error("User email, action, and entity type are required");
  }
  return apiFetch("/audit-logs", { method: "POST", body: JSON.stringify(payload) });
}

export async function getAuditLogs(filters) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, v);
  });
  return apiFetch(`/audit-logs?${params.toString()}`);
}

export async function getAuditReport(startDate, endDate, complianceLevel = null) {
  const params = new URLSearchParams({ startDate, endDate });
  if (complianceLevel) params.append("complianceLevel", complianceLevel);
  return apiFetch(`/audit-logs/report?${params.toString()}`);
}
