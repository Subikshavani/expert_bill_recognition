const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://subiksha:subi@cluster0.mycpc5v.mongodb.net/bills_db";

async function initDatabase() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("✅ Connected to MongoDB Atlas:", MONGO_URI.split("@")[1] || MONGO_URI);

  // Seed monthly expense data if empty
  const count = await MonthlyExpense.countDocuments();
  if (count === 0) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    await MonthlyExpense.insertMany(months.map((month) => ({ month, amount: 0 })));
    console.log("📅 Seeded monthly expense data");
  }
}

// User Schema with bcrypt
const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    status: { type: String, required: true, default: "Active" },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const billSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    bill_number: { type: String, required: true },
    vendor: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    department: { type: String, required: true },
    status: { type: String, required: true },
    uploaded_by: { type: String, required: true },
    uploaded_by_email: { type: String, default: "" },
    notes: { type: String, default: "" },
    stage: { type: Number, required: true },
    files: { type: [String], default: [] },
  },
  {
    timestamps: true,
    collection: "bills",
  }
);

const auditSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    bill_id: { type: String, required: true },
    action: { type: String, required: true },
    user: { type: String, required: true },
    timestamp: { type: String, required: true },
    comments: { type: String, default: "" },
  },
  { timestamps: true }
);

const monthlyExpenseSchema = new mongoose.Schema({
  month: { type: String, required: true, unique: true },
  amount: { type: Number, required: true, default: 0 },
});

const billOCRResultSchema = new mongoose.Schema(
  {
    billId: { type: String, required: true, unique: true },
    vendor: { type: String, default: "" },
    billNumber: { type: String, default: "" },
    date: { type: String, default: "" },
    amount: { type: Number, default: null },
    tax: { type: Number, default: null },
    category: { type: String, default: "" },
    rawText: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    status: { type: String, default: "pending" }, // pending, success, failed
    errorMessage: { type: String, default: "" },
    processedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "bill_ocr_results",
  }
);

const tripSessionSchema = new mongoose.Schema(
  {
    sessionId:     { type: String, required: true, unique: true },
    employeeId:    { type: String, required: true },
    employeeEmail: { type: String, required: true },
    tripName:      { type: String, required: true },
    startDate:     { type: String, required: true },
    endDate:       { type: String, default: "" },
    sessionStatus: { type: String, enum: ["Active", "Completed"], default: "Active" },
  },
  { timestamps: true, collection: "tripSessions" }
);

// Bill Template Schema
const billTemplateSchema = new mongoose.Schema(
  {
    templateId: { type: String, required: true, unique: true },
    employeeEmail: { type: String, required: true },
    templateName: { type: String, required: true },
    vendor: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "billTemplates" }
);

// Budget Limit Schema
const budgetLimitSchema = new mongoose.Schema(
  {
    budgetId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    employeeEmail: { type: String, default: "" },
    budgetType: { type: String, enum: ["department", "employee"], required: true },
    monthlyLimit: { type: Number, required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    remaining: { type: Number, required: true },
    alertThreshold: { type: Number, default: 80 }, // Alert at 80%
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "budgetLimits" }
);

// Vendor Schema
const vendorSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, unique: true },
    vendorName: { type: String, required: true, unique: true },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    category: { type: String, default: "" },
    status: { type: String, enum: ["approved", "blacklisted", "pending"], default: "pending" },
    totalSpent: { type: Number, default: 0 },
    billCount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "vendors" }
);

// Bill Comment/Approval Note Schema
const billCommentSchema = new mongoose.Schema(
  {
    commentId: { type: String, required: true, unique: true },
    billId: { type: String, required: true },
    authorEmail: { type: String, required: true },
    authorName: { type: String, required: true },
    comment: { type: String, required: true },
    commentType: { type: String, enum: ["comment", "rejection_reason", "approval_note"], required: true },
    parentCommentId: { type: String, default: "" }, // For threaded comments
  },
  { timestamps: true, collection: "billComments" }
);

// Advance Request Schema
const advanceRequestSchema = new mongoose.Schema(
  {
    advanceId: { type: String, required: true, unique: true },
    employeeEmail: { type: String, required: true },
    employeeName: { type: String, required: true },
    tripName: { type: String, required: true },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    requestDate: { type: String, required: true },
    requestStatus: { type: String, enum: ["pending", "approved", "rejected", "settled"], default: "pending" },
    approverEmail: { type: String, default: "" },
    approvalDate: { type: String, default: "" },
    approvalComments: { type: String, default: "" },
    settlementAmount: { type: Number, default: 0 }, // Amount settled against bill
    settlementDate: { type: String, default: "" },
  },
  { timestamps: true, collection: "advanceRequests" }
);

// Enhanced Audit Log Schema
const enhancedAuditLogSchema = new mongoose.Schema(
  {
    auditId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true }, // "viewed_bill", "approved_bill", etc.
    entityType: { type: String, required: true }, // "bill", "vendor", "budget", etc.
    entityId: { type: String, required: true },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    changes: { type: Object, default: {} }, // What changed (old vs new)
    timestamp: { type: String, required: true },
    complianceLevel: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true, collection: "enhancedAuditLogs" }
);

// Trip Analytics Schema (computed/cached)
const tripAnalyticsSchema = new mongoose.Schema(
  {
    analyticsId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    tripName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: "" },
    totalBills: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    approvedAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    rejectedAmount: { type: Number, default: 0 },
    categoryBreakdown: { type: Object, default: {} }, // { Fuel: 5000, Hotel: 3000 }
    advanceRequested: { type: Number, default: 0 },
    advanceApproved: { type: Number, default: 0 },
    advanceSettled: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "tripAnalytics" }
);

const User = mongoose.model("User", userSchema);
const Bill = mongoose.model("Bill", billSchema);
const AuditEvent = mongoose.model("AuditEvent", auditSchema);
const MonthlyExpense = mongoose.model("MonthlyExpense", monthlyExpenseSchema);
const BillOCRResult = mongoose.model("BillOCRResult", billOCRResultSchema);
const TripSession = mongoose.model("TripSession", tripSessionSchema);
const BillTemplate = mongoose.model("BillTemplate", billTemplateSchema);
const BudgetLimit = mongoose.model("BudgetLimit", budgetLimitSchema);
const Vendor = mongoose.model("Vendor", vendorSchema);
const BillComment = mongoose.model("BillComment", billCommentSchema);
const AdvanceRequest = mongoose.model("AdvanceRequest", advanceRequestSchema);
const EnhancedAuditLog = mongoose.model("EnhancedAuditLog", enhancedAuditLogSchema);
const TripAnalytics = mongoose.model("TripAnalytics", tripAnalyticsSchema);

module.exports = { User, Bill, AuditEvent, MonthlyExpense, BillOCRResult, TripSession, BillTemplate, BudgetLimit, Vendor, BillComment, AdvanceRequest, EnhancedAuditLog, TripAnalytics, initDatabase };
