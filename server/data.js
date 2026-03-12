// In-memory data store - Starting with ZERO data
// All mutations happen on these arrays; restart the server to reset.

const users = [];

const bills = [];

const auditEvents = [];

const monthlyExpense = [
  { month: "Jan", amount: 0 },
  { month: "Feb", amount: 0 },
  { month: "Mar", amount: 0 },
  { month: "Apr", amount: 0 },
  { month: "May", amount: 0 },
  { month: "Jun", amount: 0 },
  { month: "Jul", amount: 0 },
  { month: "Aug", amount: 0 },
  { month: "Sep", amount: 0 },
  { month: "Oct", amount: 0 },
  { month: "Nov", amount: 0 },
  { month: "Dec", amount: 0 },
];

const STATUS_STAGE = {
  "Uploaded":               1,
  "Under Accounts Review":  2,
  "Manager Approval":       3,
  "Finance Approval":       4,
  "Approved":               5,
  "Rejected":               5,
};

// Workflow: what status the bill moves to after an approval action.
const NEXT_STATUS = {
  "Under Accounts Review": { Approved: "Manager Approval",  Rejected: "Rejected" },
  "Manager Approval":      { Approved: "Finance Approval",  Rejected: "Rejected" },
  "Finance Approval":      { Approved: "Approved",          Rejected: "Rejected" },
};

let _billSeq    = bills.length;
let _userSeq    = users.length;
let _auditSeq   = auditEvents.length;

function nextBillId()  { _billSeq++;  return `BILL-${2400 + _billSeq}`; }
function nextUserId()  { _userSeq++;  return `USR-${String(_userSeq).padStart(3, "0")}`; }
function nextAuditId() { _auditSeq++; return `AUD-${7811 + _auditSeq}`; }
function nowTs() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
}

module.exports = { users, bills, auditEvents, monthlyExpense, STATUS_STAGE, NEXT_STATUS, nextBillId, nextUserId, nextAuditId, nowTs };
