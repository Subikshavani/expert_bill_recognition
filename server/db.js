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

const User = mongoose.model("User", userSchema);
const Bill = mongoose.model("Bill", billSchema);
const AuditEvent = mongoose.model("AuditEvent", auditSchema);
const MonthlyExpense = mongoose.model("MonthlyExpense", monthlyExpenseSchema);

module.exports = { User, Bill, AuditEvent, MonthlyExpense, initDatabase };
