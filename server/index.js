const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const Tesseract = require("tesseract.js");
const pdfParse = require("pdf-parse");
const { User, Bill, AuditEvent, MonthlyExpense, BillOCRResult, TripSession, BillTemplate, BudgetLimit, Vendor, BillComment, AdvanceRequest, EnhancedAuditLog, TripAnalytics, initDatabase } = require("./db");

const app = express();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/jpg", "application/pdf"]);

function fileFilter(_req, file, cb) {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and PDF files are allowed."));
  }
  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

app.use(cors());
app.use(express.json());

const STATUS_STAGE = {
  Uploaded: 1,
  "Under Accounts Review": 2,
  "Manager Approval": 3,
  "Finance Approval": 4,
  Approved: 5,
  Rejected: 5,
};

const NEXT_STATUS = {
  "Under Accounts Review": { Approved: "Manager Approval", Rejected: "Rejected" },
  "Manager Approval": { Approved: "Finance Approval", Rejected: "Rejected" },
  "Finance Approval": { Approved: "Approved", Rejected: "Rejected" },
};

function nowTs() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
}

async function nextUserId() {
  const count = await User.countDocuments();
  return `USR-${String(count + 1).padStart(3, "0")}`;
}

async function nextBillId() {
  const count = await Bill.countDocuments();
  return `BILL-${2400 + count + 1}`;
}

async function nextAuditId() {
  const count = await AuditEvent.countDocuments();
  return `AUD-${7811 + count + 1}`;
}

function parseBillRow(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    billNumber: doc.bill_number,
    vendor: doc.vendor,
    category: doc.category,
    amount: Number(doc.amount),
    date: doc.date,
    department: doc.department,
    status: doc.status,
    uploadedBy: doc.uploaded_by,
    uploadedByEmail: doc.uploaded_by_email || "",
    notes: doc.notes || "",
    stage: doc.stage,
    files: doc.files || [],
  };
}

function parseUserRow(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    department: doc.department,
    phone: doc.phone,
    status: doc.status,
  };
}

function parseTripSession(doc) {
  if (!doc) return null;
  return {
    sessionId: doc.sessionId,
    employeeId: doc.employeeId,
    employeeEmail: doc.employeeEmail,
    tripName: doc.tripName,
    startDate: doc.startDate,
    endDate: doc.endDate || "",
    sessionStatus: doc.sessionStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function normalizeDate(raw) {
  if (!raw) return "";
  const parsed = new Date(raw.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1"));
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function extractFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function inferCategory(text) {
  const t = text.toLowerCase();
  if (/fuel|petrol|diesel/.test(t)) return "Fuel";
  if (/travel|taxi|flight|bus|train/.test(t)) return "Travel";
  if (/hotel|lodging|stay/.test(t)) return "Hotel";
  if (/courier|shipping|dispatch/.test(t)) return "Courier";
  return "";
}

function parseBillText(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const vendor =
    extractFirstMatch(rawText, [
      /(?:vendor|supplier|merchant)\s*[:\-]\s*([^\n]+)/i,
      /(?:m\/?s\.?|from)\s*[:\-]\s*([^\n]+)/i,
    ]) || lines[0] || "";

  const billNumber = extractFirstMatch(rawText, [
    /(?:bill|invoice|inv)\s+(?:no\.?|number|#)\s*[:#\-]?\s*([A-Z0-9\-\/]{4,})/i,
    /(?:receipt)\s+(?:no\.?|#)\s*[:#\-]?\s*([A-Z0-9\-\/]{4,})/i,
    /(?:bill|invoice)\s*[:#]\s*([A-Z0-9\-\/]{4,})/i,
  ]);

  const rawDate = extractFirstMatch(rawText, [
    /(?:date)\s*[:\-]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    /(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})/i,
    /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
  ]);

  const amountRaw = extractFirstMatch(rawText, [
    /(?:total\s*amount|grand\s*total|amount\s*payable|total)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ]);
  const taxRaw = extractFirstMatch(rawText, [
    /(?:tax|gst|vat)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ]);

  const amount = amountRaw ? Number(String(amountRaw).replace(/,/g, "")) : null;
  const taxAmount = taxRaw ? Number(String(taxRaw).replace(/,/g, "")) : null;

  return {
    vendor: vendor || "",
    billNumber: billNumber || "",
    date: normalizeDate(rawDate),
    amount: Number.isFinite(amount) ? amount : null,
    taxAmount: Number.isFinite(taxAmount) ? taxAmount : null,
    category: inferCategory(rawText),
    rawText,
  };
}

// Runs OCR on uploaded file buffers and stores result in bill_ocr_results.
// Fire-and-forget: called after bill is saved so it doesn't delay the response.
async function runOCRAndStore(billId, multerFiles, billRecord) {
  // Pick the first billFile, fall back to any uploaded file
  const allFiles = [
    ...(multerFiles?.billFile || []),
    ...(multerFiles?.supportFile || []),
  ];
  if (allFiles.length === 0) return;

  const file = allFiles[0];
  try {
    let rawText = "";
    let confidence = 0;

    if (file.mimetype === "application/pdf") {
      const pdfResult = await pdfParse(file.buffer);
      rawText = (pdfResult?.text || "").trim();
      confidence = 0.95;
    } else {
      const ocrResult = await Tesseract.recognize(file.buffer, "eng", { logger: () => {} });
      rawText = (ocrResult?.data?.text || "").trim();
      confidence = (ocrResult?.data?.confidence || 0) / 100;
    }

    const parsed = rawText ? parseBillText(rawText) : {};

    await BillOCRResult.create({
      billId,
      vendor: parsed.vendor || billRecord.vendor || "",
      billNumber: parsed.billNumber || billRecord.bill_number || "",
      date: parsed.date || billRecord.date || "",
      amount: parsed.amount !== null && parsed.amount !== undefined ? parsed.amount : billRecord.amount || null,
      tax: parsed.taxAmount || null,
      category: parsed.category || billRecord.category || "",
      rawText: rawText || "",
      confidence,
      status: rawText ? "success" : "failed",
      errorMessage: rawText ? "" : "No text extracted from uploaded file",
      processedAt: new Date(),
    });

    console.log(`✅ OCR stored for ${billId} (confidence: ${(confidence * 100).toFixed(1)}%)`);
  } catch (err) {
    console.error(`❌ OCR failed for ${billId}:`, err.message);
    // Store failed attempt so it's visible in bill_ocr_results
    await BillOCRResult.create({
      billId,
      status: "failed",
      errorMessage: err.message,
      processedAt: new Date(),
    }).catch(() => {});
  }
}

app.post("/api/ocr-bill", upload.single("billFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Bill file is required." });
    }

    let rawText = "";
    if (req.file.mimetype === "application/pdf") {
      const pdfResult = await pdfParse(req.file.buffer);
      rawText = (pdfResult?.text || "").trim();
    } else {
      const ocrResult = await Tesseract.recognize(req.file.buffer, "eng", {
        logger: () => {},
      });
      rawText = (ocrResult?.data?.text || "").trim();
    }

    const parsed = parseBillText(rawText);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({
      error: "Failed to process OCR.",
      rawText: "",
    });
  }
});

app.get("/api/dashboard", async (_req, res) => {
  try {
    const [agg] = await Bill.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $not: [{ $in: ["$status", ["Approved", "Rejected"]] }] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          totalAmt: { $sum: "$amount" },
        },
      },
    ]);

    const chartStatus = await Bill.aggregate([
      { $group: { _id: "$status", value: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: 1 } },
      { $sort: { name: 1 } },
    ]);

    const MONTH_ORDER = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
    const chartMonthly = await MonthlyExpense.find({}, "month amount -_id").lean();
    chartMonthly.sort((a, b) => (MONTH_ORDER[a.month] || 0) - (MONTH_ORDER[b.month] || 0));

    const total = agg?.total || 0;
    const pending = agg?.pending || 0;
    const approved = agg?.approved || 0;
    const rejected = agg?.rejected || 0;
    const totalAmt = agg?.totalAmt || 0;

    res.json({
      stats: [
        { label: "Total Bills Submitted", value: total, delta: `${total} in system` },
        { label: "Bills Pending Approval", value: pending, delta: `${pending} need review` },
        {
          label: "Approved Bills",
          value: approved,
          delta: `${total ? ((approved / total) * 100).toFixed(1) : 0}% approval rate`,
        },
        {
          label: "Rejected Bills",
          value: rejected,
          delta: `${total ? ((rejected / total) * 100).toFixed(1) : 0}% rejection rate`,
        },
        { label: "Total Expense Amount", value: `$${totalAmt.toLocaleString()}`, delta: "Persisted in database" },
      ],
      chartStatus,
      chartMonthly,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard data." });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const rows = await User.find({}, "id name email role department phone password status -_id")
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to load users." });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, email, role, department, phone = "", password = "" } = req.body;
    if (!name || !email || !role || !department) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const id = await nextUserId();
    const normalizedEmail = String(email).toLowerCase().trim();
    await new User({ id, name, email: normalizedEmail, role, department, phone, password, status: "Active" }).save();
    res.status(201).json({ id, name, email: normalizedEmail, role, department, phone, password, status: "Active" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user." });
  }
});

app.post("/api/employee/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isHashed = typeof user.password === "string" && user.password.startsWith("$2");
    const isPasswordValid = isHashed
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!isHashed) {
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    if (user.status !== "Active") {
      return res.status(403).json({ error: "Account is inactive. Contact admin." });
    }

    res.json({
      message: "Login successful",
      user: parseUserRow(user),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to login employee." });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: "User not found." });

    user.status = user.status === "Active" ? "Inactive" : "Active";
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, phone: user.phone, password: user.password, status: user.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

app.get("/api/bills", async (req, res) => {
  try {
    const query = {};

    if (req.query.pending === "true") {
      query.status = { $in: ["Manager Approval", "Finance Approval", "Under Accounts Review"] };
    }

    if (req.query.search) {
      const q = req.query.search;
      query.$or = [
        { id: { $regex: q, $options: "i" } },
        { vendor: { $regex: q, $options: "i" } },
        { bill_number: { $regex: q, $options: "i" } },
      ];
    }

    if (req.query.status && req.query.status !== "All") {
      query.status = req.query.status;
    }

    const rows = await Bill.find(query).sort({ createdAt: -1 }).lean();
    res.json(rows.map(parseBillRow));
  } catch (error) {
    res.status(500).json({ error: "Failed to load bills." });
  }
});

app.get("/api/bills/:id", async (req, res) => {
  try {
    const row = await Bill.findOne({ id: req.params.id }).lean();
    if (!row) return res.status(404).json({ error: "Bill not found." });
    res.json(parseBillRow(row));
  } catch (error) {
    res.status(500).json({ error: "Failed to load bill." });
  }
});

app.post(
  "/api/bills",
  upload.fields([{ name: "billFile", maxCount: 5 }, { name: "supportFile", maxCount: 5 }]),
  async (req, res) => {
    try {
      const { billNumber, vendorName, category, amount, date, department, uploadedBy = "Current User", notes = "" } = req.body;
      if (!billNumber || !vendorName || !amount || !date || !department) {
        return res.status(400).json({ error: "Required fields missing." });
      }

      const files = [];
      if (req.files?.billFile) files.push(...req.files.billFile.map((f) => f.originalname));
      if (req.files?.supportFile) files.push(...req.files.supportFile.map((f) => f.originalname));

      const id = await nextBillId();
      const billData = {
        id,
        bill_number: billNumber,
        vendor: vendorName,
        category: category || "Fuel",
        amount: parseFloat(amount),
        date,
        department,
        status: "Uploaded",
        uploaded_by: uploadedBy,
        uploaded_by_email: req.body.uploadedByEmail || "",
        notes,
        stage: 1,
        files,
      };

      await new Bill(billData).save();

      const auditId = await nextAuditId();
      await new AuditEvent({
        id: auditId,
        bill_id: id,
        action: "Submitted",
        user: uploadedBy,
        timestamp: nowTs(),
        comments: `Files: ${files.join(", ") || "none"}`,
      }).save();

      // Auto-OCR: run in background so upload response is not delayed
      if (req.files && (req.files.billFile || req.files.supportFile)) {
        runOCRAndStore(id, req.files, billData).catch(() => {});
      }

      res.status(201).json(parseBillRow(billData));
    } catch (error) {
      res.status(500).json({ error: "Failed to create bill." });
    }
  }
);

app.post(
  "/api/employee/bills",
  upload.fields([{ name: "billFile", maxCount: 5 }, { name: "supportFile", maxCount: 5 }]),
  async (req, res) => {
    try {
      const {
        billNumber,
        vendorName,
        category,
        amount,
        date,
        department,
        notes = "",
        employeeEmail,
        employeeName,
        sessionId = "",
      } = req.body;

      if (!billNumber || !vendorName || !amount || !date || !department || !employeeEmail) {
        return res.status(400).json({ error: "Required fields missing." });
      }

      // ── Trip Session Guard ────────────────────────────────────────────────
      const normalizedEmail = String(employeeEmail).toLowerCase().trim();
      const activeSession = await TripSession.findOne({
        employeeEmail: normalizedEmail,
        sessionStatus: "Active",
      }).lean();

      if (!activeSession) {
        return res.status(403).json({
          error: "Trip session ended. Bill uploads are no longer allowed.",
        });
      }
      // ─────────────────────────────────────────────────────────────────────

      const files = [];
      if (req.files?.billFile) files.push(...req.files.billFile.map((f) => f.originalname));
      if (req.files?.supportFile) files.push(...req.files.supportFile.map((f) => f.originalname));

      const id = await nextBillId();
      const billData = {
        id,
        bill_number: billNumber,
        vendor: vendorName,
        category: category || "Fuel",
        amount: parseFloat(amount),
        date,
        department,
        status: "Uploaded",
        uploaded_by: employeeName || employeeEmail,
        uploaded_by_email: normalizedEmail,
        notes: notes + (activeSession.sessionId ? ` [Session: ${activeSession.sessionId} – ${activeSession.tripName}]` : ""),
        stage: 1,
        files,
      };

      await new Bill(billData).save();

      const auditId = await nextAuditId();
      await new AuditEvent({
        id: auditId,
        bill_id: id,
        action: "Submitted",
        user: employeeName || employeeEmail,
        timestamp: nowTs(),
        comments: `Files: ${files.join(", ") || "none"}`,
      }).save();

      // Auto-OCR: run in background so upload response is not delayed
      if (req.files && (req.files.billFile || req.files.supportFile)) {
        runOCRAndStore(id, req.files, billData).catch(() => {});
      }

      res.status(201).json(parseBillRow(billData));
    } catch (error) {
      res.status(500).json({ error: "Failed to create bill." });
    }
  }
);

app.get("/api/employee/bills", async (req, res) => {
  try {
    const employeeEmail = String(req.query.email || "").toLowerCase().trim();
    if (!employeeEmail) {
      return res.status(400).json({ error: "Employee email is required." });
    }

    const rows = await Bill.find({ uploaded_by_email: employeeEmail }).sort({ createdAt: -1 }).lean();
    res.json(rows.map(parseBillRow));
  } catch (error) {
    res.status(500).json({ error: "Failed to load employee bills." });
  }
});

app.get("/api/employee/bills/status", async (req, res) => {
  try {
    const employeeEmail = String(req.query.email || "").toLowerCase().trim();
    if (!employeeEmail) {
      return res.status(400).json({ error: "Employee email is required." });
    }

    const rows = await Bill.find({ uploaded_by_email: employeeEmail }, "id bill_number status date amount vendor department notes -_id")
      .sort({ createdAt: -1 })
      .lean();

    const billIds = rows.map((row) => row.id);
    const events = await AuditEvent.find({ bill_id: { $in: billIds } }, "bill_id action user timestamp comments -_id")
      .sort({ createdAt: 1 })
      .lean();

    const timelineMap = new Map();
    for (const event of events) {
      if (!timelineMap.has(event.bill_id)) timelineMap.set(event.bill_id, []);
      timelineMap.get(event.bill_id).push({
        action: event.action,
        user: event.user,
        timestamp: event.timestamp,
        remarks: event.comments || "",
      });
    }

    res.json(
      rows.map((row) => ({
        id: row.id,
        billNumber: row.bill_number,
        status: row.status,
        date: row.date,
        amount: row.amount,
        vendor: row.vendor,
        department: row.department,
        notes: row.notes || "",
        timeline: timelineMap.get(row.id) || [],
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to load bill statuses." });
  }
});

app.post("/api/bills/:id/action", async (req, res) => {
  try {
    const bill = await Bill.findOne({ id: req.params.id });
    if (!bill) return res.status(404).json({ error: "Bill not found." });

    const { action, comment = "", user = "System" } = req.body;
    if (!["Approved", "Rejected", "Clarification Requested"].includes(action)) {
      return res.status(400).json({ error: "Invalid action." });
    }

    if (action !== "Clarification Requested") {
      const transitions = NEXT_STATUS[bill.status];
      if (transitions) {
        const ns = transitions[action];
        if (ns) {
          bill.status = ns;
          bill.stage = STATUS_STAGE[ns] || bill.stage;
        }
      }
    }

    await bill.save();

    const auditId = await nextAuditId();
    await new AuditEvent({ id: auditId, bill_id: bill.id, action, user, timestamp: nowTs(), comments: comment }).save();

    res.json({ bill: parseBillRow(bill), message: `${action} recorded.` });
  } catch (error) {
    res.status(500).json({ error: "Failed to update bill action." });
  }
});

app.get("/api/audit", async (_req, res) => {
  try {
    const rows = await AuditEvent.find({}, "id bill_id action user timestamp comments -_id")
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows.map((r) => ({ id: r.id, billId: r.bill_id, action: r.action, user: r.user, timestamp: r.timestamp, comments: r.comments })));
  } catch (error) {
    res.status(500).json({ error: "Failed to load audit events." });
  }
});

/**
 * OCR Processing Endpoint
 * POST /api/process-ocr
 * 
 * Accepts file uploads for bills and processes them with OCR.
 * Can process single or multiple files.
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - Files: Upload files with field name matching: 'file_<billId>'
 * - Or use field 'files' and provide 'billIds' as JSON
 * 
 * Response:
 * { message, processed, success, failed, results: [] }
 */
app.post("/api/process-ocr", upload.any(), async (req, res) => {
  const processLog = {
    startTime: new Date(),
    processed: 0,
    success: 0,
    failed: 0,
    results: [],
    errors: [],
  };

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: "No files uploaded.",
        message: "Please upload bill files for OCR processing.",
        hint: "Use multipart/form-data with field names like 'file_<billId>' or use 'files' field"
      });
    }

    console.log(`📋 OCR Processing: ${req.files.length} file(s) received`);

    // Process each uploaded file
    for (const file of req.files) {
      processLog.processed++;

      // Extract billId from field name (e.g., 'file_BILL-2405' or from req.body.billIds)
      let billId = "";
      
      // Method 1: Extract from field name (e.g., file_BILL-2405)
      if (file.fieldname.startsWith("file_")) {
        billId = file.fieldname.substring(5);
      }
      // Method 2: Use billId from body if provided
      else if (req.body.billId) {
        billId = req.body.billId;
      }
      // Method 3: Use filename without extension as fallback
      else {
        billId = file.originalname.split(".")[0];
      }

      try {
        // Check if this bill already has OCR results
        const existingResult = await BillOCRResult.findOne({ billId });
        
        if (existingResult) {
          console.log(`⏭️  Skipping ${billId}: OCR already processed`);
          processLog.results.push({
            billId,
            status: "skipped",
            reason: "Already processed",
            processedAt: new Date(),
          });
          continue;
        }

        // Check if bill exists in bills collection
        const billRecord = await Bill.findOne({ id: billId }).lean();
        if (!billRecord) {
          console.warn(`⚠️  Bill ${billId} not found in bills collection`);
          processLog.results.push({
            billId,
            status: "failed",
            reason: "Bill not found in database",
            processedAt: new Date(),
          });
          processLog.failed++;
          continue;
        }

        // Extract text from file using OCR
        let rawText = "";
        let ocrConfidence = 0;

        try {
          if (file.mimetype === "application/pdf") {
            const pdfResult = await pdfParse(file.buffer);
            rawText = (pdfResult?.text || "").trim();
            ocrConfidence = 0.95; // PDFs are generally more reliable
          } else if (["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)) {
            const ocrResult = await Tesseract.recognize(file.buffer, "eng", {
              logger: (m) => {
                // Optional: Log progress
                if (m.status === "recognizing text") {
                  ocrConfidence = Math.max(ocrConfidence, m.progress || 0);
                }
              },
            });
            rawText = (ocrResult?.data?.text || "").trim();
            ocrConfidence = ocrResult?.data?.confidence || 0;
          } else {
            throw new Error(`Unsupported file type: ${file.mimetype}`);
          }
        } catch (ocrError) {
          throw new Error(`OCR processing failed: ${ocrError.message}`);
        }

        if (!rawText) {
          console.warn(`⚠️  No text extracted from ${billId}`);
          // Store empty result
          await BillOCRResult.create({
            billId,
            rawText: "",
            status: "failed",
            errorMessage: "No text extracted from image",
            confidence: 0,
            processedAt: new Date(),
          });
          processLog.results.push({
            billId,
            status: "failed",
            reason: "No text extracted from image",
            processedAt: new Date(),
          });
          processLog.failed++;
          continue;
        }

        // Parse extracted text to extract structured data
        const parsed = parseBillText(rawText);

        // Create OCR result document
        const ocrResult = {
          billId,
          vendor: parsed.vendor || billRecord.vendor || "",
          billNumber: parsed.billNumber || billRecord.bill_number || "",
          date: parsed.date || billRecord.date || "",
          amount: parsed.amount !== null ? parsed.amount : billRecord.amount || null,
          tax: parsed.taxAmount || null,
          category: parsed.category || billRecord.category || "",
          rawText,
          confidence: ocrConfidence,
          status: "success",
          errorMessage: "",
          processedAt: new Date(),
        };

        // Store result in MongoDB
        await BillOCRResult.create(ocrResult);

        console.log(`✅ Successfully processed ${billId}`);
        processLog.results.push({
          billId,
          status: "success",
          data: {
            vendor: ocrResult.vendor,
            billNumber: ocrResult.billNumber,
            date: ocrResult.date,
            amount: ocrResult.amount,
            tax: ocrResult.tax,
          },
          confidence: ocrConfidence,
          processedAt: new Date(),
        });
        processLog.success++;

      } catch (fileProcessError) {
        console.error(`❌ Error processing ${billId}:`, fileProcessError.message);
        
        // Store failed result
        try {
          await BillOCRResult.updateOne(
            { billId },
            {
              $set: {
                status: "failed",
                errorMessage: fileProcessError.message,
                processedAt: new Date(),
              },
            },
            { upsert: true }
          );
        } catch (storeError) {
          console.error(`Error storing failed result for ${billId}:`, storeError.message);
        }

        processLog.failed++;
        processLog.results.push({
          billId,
          status: "failed",
          reason: fileProcessError.message,
          processedAt: new Date(),
        });
        processLog.errors.push({
          billId,
          error: fileProcessError.message,
        });
      }
    }

    console.log(`\n📊 OCR Processing Summary:`);
    console.log(`   Total Processed: ${processLog.processed}`);
    console.log(`   ✅ Success: ${processLog.success}`);
    console.log(`   ❌ Failed: ${processLog.failed}`);
    console.log(`   ⏭️  Skipped: ${processLog.processed - processLog.success - processLog.failed}`);

    res.json({
      message: "OCR processing completed",
      processed: processLog.processed,
      success: processLog.success,
      failed: processLog.failed,
      skipped: processLog.processed - processLog.success - processLog.failed,
      results: processLog.results,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error("❌ OCR Processing Error:", error.message);
    res.status(500).json({
      error: "OCR processing failed",
      message: error.message,
      processed: processLog.processed,
      success: processLog.success,
      failed: processLog.failed,
    });
  }
});

/**
 * Get OCR Results
 * GET /api/ocr-results
 * 
 * Retrieve OCR results for all or specific bills.
 * 
 * Query Parameters:
 * - billId (optional): Get result for specific bill
 * - status (optional): Filter by status (success, failed, pending)
 * - limit (optional): Limit results (default: 50)
 */
app.get("/api/ocr-results", async (req, res) => {
  try {
    const { billId, status, limit = 50 } = req.query;
    const query = {};

    if (billId) {
      query.billId = billId;
    }
    if (status) {
      query.status = status;
    }

    const results = await BillOCRResult.find(query)
      .sort({ processedAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    const stats = await BillOCRResult.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      results,
      stats: stats.reduce((acc, stat) => ({ ...acc, [stat._id]: stat.count }), {}),
      total: results.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve OCR results." });
  }
});

/**
 * Reprocess OCR for Specific Bill
 * POST /api/ocr-results/:billId/reprocess
 * 
 * Reprocess OCR for a specific bill if file is provided.
 */
app.post("/api/ocr-results/:billId/reprocess", upload.single("file"), async (req, res) => {
  try {
    const { billId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "File is required for reprocessing." });
    }

    // Check if bill exists
    const bill = await Bill.findOne({ id: billId }).lean();
    if (!bill) {
      return res.status(404).json({ error: "Bill not found." });
    }

    // Process file
    let rawText = "";
    let ocrConfidence = 0;

    try {
      if (req.file.mimetype === "application/pdf") {
        const pdfResult = await pdfParse(req.file.buffer);
        rawText = (pdfResult?.text || "").trim();
        ocrConfidence = 0.95;
      } else {
        const ocrResult = await Tesseract.recognize(req.file.buffer, "eng", {
          logger: () => {},
        });
        rawText = (ocrResult?.data?.text || "").trim();
        ocrConfidence = ocrResult?.data?.confidence || 0;
      }
    } catch (ocrError) {
      return res.status(500).json({ error: `OCR failed: ${ocrError.message}` });
    }

    if (!rawText) {
      return res.status(400).json({ error: "No text could be extracted from the image." });
    }

    // Parse extracted text
    const parsed = parseBillText(rawText);

    // Update or create result
    const ocrResult = await BillOCRResult.findOneAndUpdate(
      { billId },
      {
        vendor: parsed.vendor || bill.vendor || "",
        billNumber: parsed.billNumber || bill.bill_number || "",
        date: parsed.date || bill.date || "",
        amount: parsed.amount !== null ? parsed.amount : bill.amount || null,
        tax: parsed.taxAmount || null,
        category: parsed.category || bill.category || "",
        rawText,
        confidence: ocrConfidence,
        status: "success",
        errorMessage: "",
        processedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "OCR reprocessed successfully",
      billId,
      data: {
        vendor: ocrResult.vendor,
        billNumber: ocrResult.billNumber,
        date: ocrResult.date,
        amount: ocrResult.amount,
        tax: ocrResult.tax,
        category: ocrResult.category,
        confidence: ocrConfidence,
      },
      processedAt: ocrResult.processedAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to reprocess OCR.", message: error.message });
  }
});

/**
 * Get Active or Latest Trip Session
 * GET /api/trip-session?email=<email>
 */
app.get("/api/trip-session", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const session = await TripSession.findOne({
      employeeEmail: normalizedEmail,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(session ? parseTripSession(session) : null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trip session." });
  }
});

/**
 * Get All Trip Sessions
 * GET /api/trip-sessions?email=<email>
 */
app.get("/api/trip-sessions", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const sessions = await TripSession.find({
      employeeEmail: normalizedEmail,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(sessions.map(parseTripSession));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trip sessions." });
  }
});

/**
 * Start New Trip Session
 * POST /api/trip-session/start
 */
app.post("/api/trip-session/start", async (req, res) => {
  try {
    const { employeeId, employeeEmail, tripName, startDate } = req.body;
    if (!employeeId || !employeeEmail || !tripName || !startDate) {
      return res.status(400).json({
        error: "employeeId, employeeEmail, tripName, and startDate are required.",
      });
    }
    const normalizedEmail = String(employeeEmail).toLowerCase().trim();
    // End any existing active session for this employee
    await TripSession.updateMany(
      { employeeEmail: normalizedEmail, sessionStatus: "Active" },
      { sessionStatus: "Completed", endDate: new Date().toISOString().split("T")[0] }
    );
    // Create new session
    const sessionId = `TRIP-${Date.now()}`;
    const newSession = await TripSession.create({
      sessionId,
      employeeId,
      employeeEmail: normalizedEmail,
      tripName,
      startDate,
      endDate: "",
      sessionStatus: "Active",
    });
    res.status(201).json(parseTripSession(newSession));
  } catch (error) {
    res.status(500).json({ error: "Failed to start trip session." });
  }
});

/**
 * End Trip Session
 * PATCH /api/trip-session/:sessionId/end
 */
app.patch("/api/trip-session/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endDate } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }
    const updated = await TripSession.findOneAndUpdate(
      { sessionId },
      {
        sessionStatus: "Completed",
        endDate: endDate || new Date().toISOString().split("T")[0],
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Trip session not found." });
    }
    res.json(parseTripSession(updated));
  } catch (error) {
    res.status(500).json({ error: "Failed to end trip session." });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 📋 BILL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

app.post("/api/bill-templates", async (req, res) => {
  try {
    const { employeeEmail, templateName, vendor, category, description } = req.body;
    if (!employeeEmail || !templateName || !vendor || !category) {
      return res.status(400).json({ error: "Required fields missing." });
    }
    const templateId = `TMPL-${Date.now()}`;
    const template = await BillTemplate.create({
      templateId,
      employeeEmail: employeeEmail.toLowerCase().trim(),
      templateName,
      vendor,
      category,
      description,
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: "Failed to create template." });
  }
});

app.get("/api/bill-templates", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required." });
    const templates = await BillTemplate.find({
      employeeEmail: email.toLowerCase().trim(),
      isActive: true,
    }).lean();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch templates." });
  }
});

app.delete("/api/bill-templates/:templateId", async (req, res) => {
  try {
    const { templateId } = req.params;
    await BillTemplate.findOneAndUpdate({ templateId }, { isActive: false }, { new: true });
    res.json({ message: "Template deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete template." });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 💰 BUDGET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

app.post("/api/budgets", async (req, res) => {
  try {
    const { department, employeeEmail, budgetType, monthlyLimit, year, month } = req.body;
    if (!department || !budgetType || !monthlyLimit || !year || !month) {
      return res.status(400).json({ error: "Required fields missing." });
    }
    const budgetId = `BUD-${Date.now()}`;
    const budget = await BudgetLimit.create({
      budgetId,
      department,
      employeeEmail: employeeEmail ? employeeEmail.toLowerCase().trim() : "",
      budgetType,
      monthlyLimit,
      year,
      month,
      remaining: monthlyLimit,
    });
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: "Failed to create budget." });
  }
});

app.get("/api/budgets", async (req, res) => {
  try {
    const { department, email, year, month } = req.query;
    const query = {};
    if (department) query.department = department;
    if (email) query.employeeEmail = email.toLowerCase().trim();
    if (year && month) {
      query.year = parseInt(year);
      query.month = parseInt(month);
    }
    const budgets = await BudgetLimit.find(query).lean();
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budgets." });
  }
});

app.patch("/api/budgets/:budgetId/update-spent", async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { spentAmount } = req.body;
    if (spentAmount === undefined) {
      return res.status(400).json({ error: "Spent amount is required." });
    }
    const budget = await BudgetLimit.findOne({ budgetId });
    if (!budget) return res.status(404).json({ error: "Budget not found." });
    budget.spent += spentAmount;
    budget.remaining = Math.max(0, budget.monthlyLimit - budget.spent);
    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: "Failed to update budget." });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 🏢 VENDOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

app.post("/api/vendors", async (req, res) => {
  try {
    const { vendorName, contactEmail, contactPhone, category } = req.body;
    if (!vendorName) return res.status(400).json({ error: "Vendor name is required." });
    const vendorId = `VENDOR-${Date.now()}`;
    const vendor = await Vendor.create({
      vendorId,
      vendorName,
      contactEmail,
      contactPhone,
      category,
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: "Failed to create vendor." });
  }
});

app.get("/api/vendors", async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const vendors = await Vendor.find(query).lean();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vendors." });
  }
});

app.patch("/api/vendors/:vendorId/status", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.body;
    if (!["approved", "blacklisted", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    const vendor = await Vendor.findOneAndUpdate({ vendorId }, { status }, { new: true });
    if (!vendor) return res.status(404).json({ error: "Vendor not found." });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: "Failed to update vendor status." });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 💬 BILL COMMENTS & APPROVAL NOTES
// ═══════════════════════════════════════════════════════════════════════

app.post("/api/bill-comments", async (req, res) => {
  try {
    const { billId, authorEmail, authorName, comment, commentType, parentCommentId } = req.body;
    if (!billId || !authorEmail || !comment || !commentType) {
      return res.status(400).json({ error: "Required fields missing." });
    }
    const commentId = `CMT-${Date.now()}`;
    const newComment = await BillComment.create({
      commentId,
      billId,
      authorEmail: authorEmail.toLowerCase().trim(),
      authorName,
      comment,
      commentType,
      parentCommentId: parentCommentId || "",
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create comment." });
  }
});

app.get("/api/bill-comments/:billId", async (req, res) => {
  try {
    const { billId } = req.params;
    const comments = await BillComment.find({ billId }).sort({ createdAt: 1 }).lean();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments." });
  }
});

app.delete("/api/bill-comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    await BillComment.findOneAndDelete({ commentId });
    res.json({ message: "Comment deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment." });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 💳 ADVANCE REQUESTS
// ═══════════════════════════════════════════════════════════════════════

app.post("/api/advance-requests", async (req, res) => {
  try {
    const { employeeEmail, employeeName, tripName, amount, purpose, requestDate } = req.body;
    if (!employeeEmail || !tripName || !amount || !purpose) {
      return res.status(400).json({ error: "Required fields missing." });
    }
    const advanceId = `ADV-${Date.now()}`;
    const request = await AdvanceRequest.create({
      advanceId,
      employeeEmail: employeeEmail.toLowerCase().trim(),
      employeeName,
      tripName,
      amount,
      purpose,
      requestDate,
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to create advance request." });
  }
});

app.get("/api/advance-requests", async (req, res) => {
  try {
    const { email, status } = req.query;
    const query = {};
    if (email) query.employeeEmail = email.toLowerCase().trim();
    if (status) query.requestStatus = status;
    const requests = await AdvanceRequest.find(query).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch advance requests." });
  }
});

app.patch("/api/advance-requests/:advanceId/approve", async (req, res) => {
  try {
    const { advanceId } = req.params;
    const { approverEmail, approvalComments } = req.body;
    const request = await AdvanceRequest.findOneAndUpdate(
      { advanceId },
      {
        requestStatus: "approved",
        approverEmail: approverEmail.toLowerCase().trim(),
        approvalDate: new Date().toISOString().split("T")[0],
        approvalComments,
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Advance request not found." });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to approve advance request." });
  }
});

app.patch("/api/advance-requests/:advanceId/settle", async (req, res) => {
  try {
    const { advanceId } = req.params;
    const { settlementAmount } = req.body;
    const request = await AdvanceRequest.findOneAndUpdate(
      { advanceId },
      {
        requestStatus: "settled",
        settlementAmount,
        settlementDate: new Date().toISOString().split("T")[0],
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Advance request not found." });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to settle advance request." });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 📊 TRIP ANALYTICS
// ═══════════════════════════════════════════════════════════════════════

app.post("/api/trip-analytics/compute", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID is required." });
    
    const session = await TripSession.findOne({ sessionId }).lean();
    if (!session) return res.status(404).json({ error: "Session not found." });

    const bills = await Bill.find({
      notes: { $regex: sessionId },
      uploaded_by_email: session.employeeEmail,
    }).lean();

    const categoryBreakdown = {};
    let totalAmount = 0, approvedAmount = 0, pendingAmount = 0, rejectedAmount = 0;

    bills.forEach((bill) => {
      totalAmount += bill.amount;
      if (bill.status === "Approved") approvedAmount += bill.amount;
      else if (["Uploaded", "Under Accounts Review", "Manager Approval", "Finance Approval"].includes(bill.status))
        pendingAmount += bill.amount;
      else if (bill.status === "Rejected") rejectedAmount += bill.amount;

      categoryBreakdown[bill.category] = (categoryBreakdown[bill.category] || 0) + bill.amount;
    });

    const analyticsId = `ANALYTICS-${Date.now()}`;
    const analytics = await TripAnalytics.create({
      analyticsId,
      sessionId,
      employeeEmail: session.employeeEmail,
      tripName: session.tripName,
      startDate: session.startDate,
      endDate: session.endDate,
      totalBills: bills.length,
      totalAmount,
      approvedAmount,
      pendingAmount,
      rejectedAmount,
      categoryBreakdown,
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: "Failed to compute analytics." });
  }
});

app.get("/api/trip-analytics/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const analytics = await TripAnalytics.findOne({ sessionId }).lean();
    if (!analytics) return res.status(404).json({ error: "Analytics not found." });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics." });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 🔐 ENHANCED AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════════

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
}

app.post("/api/audit-logs", async (req, res) => {
  try {
    const { userId, userEmail, userName, action, entityType, entityId, changes } = req.body;
    if (!action || !entityType || !entityId) {
      return res.status(400).json({ error: "Required fields missing." });
    }
    const auditId = `AUL-${Date.now()}`;
    const log = await EnhancedAuditLog.create({
      auditId,
      userId: userId || "",
      userEmail: userEmail.toLowerCase().trim(),
      userName,
      action,
      entityType,
      entityId,
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"] || "",
      changes: changes || {},
      timestamp: nowTs(),
      complianceLevel: "high",
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: "Failed to create audit log." });
  }
});

app.get("/api/audit-logs", async (req, res) => {
  try {
    const { entityType, entityId, userEmail, limit = 100 } = req.query;
    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userEmail) query.userEmail = userEmail.toLowerCase().trim();
    
    const logs = await EnhancedAuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs." });
  }
});

app.get("/api/audit-logs/report", async (req, res) => {
  try {
    const { startDate, endDate, complianceLevel } = req.query;
    const query = {};
    if (startDate && endDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    }
    if (complianceLevel) query.complianceLevel = complianceLevel;

    const logs = await EnhancedAuditLog.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const summary = {
      totalEvents: logs.length,
      actionSummary: {},
      userViews: {},
    };

    logs.forEach((log) => {
      summary.actionSummary[log.action] = (summary.actionSummary[log.action] || 0) + 1;
      summary.userViews[log.userEmail] = (summary.userViews[log.userEmail] || 0) + 1;
    });

    res.json({ logs, summary });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate audit report." });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 10MB limit." });
    }
    return res.status(400).json({ error: error.message });
  }

  if (error?.message === "Only JPG, PNG, and PDF files are allowed.") {
    return res.status(400).json({ error: error.message });
  }

  return next(error);
});

const PORT = Number(process.env.PORT) || 3001;

function startServer(initialPort, maxPortRetries = 3) {
  let remainingRetries = maxPortRetries;

  const listenOnPort = (port) => {
    const server = app.listen(port, () => {
      console.log(`Expense-API running -> http://localhost:${port}`);
    });

    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE" && remainingRetries > 0) {
        remainingRetries -= 1;
        const nextPort = port + 1;
        console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
        listenOnPort(nextPort);
        return;
      }

      console.error("Server failed to start:", error);
      process.exit(1);
    });
  };

  listenOnPort(initialPort);
}

initDatabase()
  .then(() => {
    startServer(PORT);
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
