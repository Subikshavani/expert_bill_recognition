const { initDatabase, Bill, User, TripSession } = require("../db");
const mongoose = require("mongoose");

function extractSessionIdFromNotes(notes = "") {
  const match = String(notes).match(/\[Session:\s*([^\s\]]+)/);
  return match ? match[1] : "";
}

async function run() {
  await initDatabase();

  // Build a lookup from employee submitted bills (if they already have session ids).
  const users = await User.find({}, "email submittedBills.id submittedBills.sessionId submittedBills.notes").lean();
  const submittedBillSessionById = new Map();

  for (const user of users) {
    for (const sb of user.submittedBills || []) {
      const sid = sb.sessionId || extractSessionIdFromNotes(sb.notes);
      if (sid && sb.id && !submittedBillSessionById.has(sb.id)) {
        submittedBillSessionById.set(sb.id, sid);
      }
    }
  }

  // Build latest trip session map per employee email.
  const sessions = await TripSession.find({}, "employeeEmail sessionId createdAt").sort({ createdAt: -1 }).lean();
  const latestSessionByEmail = new Map();
  for (const s of sessions) {
    const email = String(s.employeeEmail || "").toLowerCase().trim();
    if (email && s.sessionId && !latestSessionByEmail.has(email)) {
      latestSessionByEmail.set(email, s.sessionId);
    }
  }

  const candidates = await Bill.find(
    {
      $or: [
        { sessionId: { $exists: false } },
        { sessionId: "" },
      ],
    },
    "id uploaded_by_email notes sessionId"
  ).lean();

  let updated = 0;
  let unresolved = 0;
  let createdLegacySessions = 0;
  let legacyCounter = 0;
  const legacySessionByEmail = new Map();

  function nextLegacySessionId() {
    legacyCounter += 1;
    return `TRIP-LEGACY-${Date.now()}-${legacyCounter}`;
  }

  for (const bill of candidates) {
    const email = String(bill.uploaded_by_email || "").toLowerCase().trim();
    const resolvedSessionId =
      bill.sessionId ||
      extractSessionIdFromNotes(bill.notes) ||
      submittedBillSessionById.get(bill.id) ||
      latestSessionByEmail.get(email) ||
      "";

    let finalSessionId = resolvedSessionId;
    if (!finalSessionId) {
      unresolved += 1;
      const emailKey = email || `legacy+${bill.id}@unknown.local`;
      if (legacySessionByEmail.has(emailKey)) {
        finalSessionId = legacySessionByEmail.get(emailKey);
      } else {
        const startDate = String(bill.notes || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || new Date().toISOString().split("T")[0];
        const sessionId = nextLegacySessionId();
        await TripSession.create({
          sessionId,
          employeeId: "EMP-LEGACY",
          employeeEmail: emailKey,
          tripName: "Legacy Backfilled Session",
          startDate,
          endDate: startDate,
          sessionStatus: "Completed",
        });
        legacySessionByEmail.set(emailKey, sessionId);
        finalSessionId = sessionId;
        createdLegacySessions += 1;
      }
    }

    const notes = String(bill.notes || "");
    const nextNotes = notes.includes("[Session:")
      ? notes
      : `${notes}${notes ? " " : ""}[Session: ${finalSessionId}]`;

    await Bill.updateOne(
      { id: bill.id },
      {
        $set: {
          sessionId: finalSessionId,
          notes: nextNotes,
        },
      }
    );

    updated += 1;
  }

  const remaining = await Bill.countDocuments({
    $or: [
      { sessionId: { $exists: false } },
      { sessionId: "" },
    ],
  });

  console.log(
    `Backfill complete. Candidates: ${candidates.length}, Updated: ${updated}, LegacySessionsCreated: ${createdLegacySessions}, InitiallyUnresolved: ${unresolved}, RemainingWithoutSession: ${remaining}`
  );
}

run()
  .catch((err) => {
    console.error("Backfill failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
