const mongoose = require("mongoose");
const {
  initDatabase,
  Bill,
  User,
  AuditEvent,
  BillOCRResult,
  BillComment,
  EnhancedAuditLog,
} = require("../db");

async function run() {
  await initDatabase();

  const [billsResult, usersResult, auditResult, ocrResult, commentsResult, auditLogsResult] = await Promise.all([
    Bill.deleteMany({}),
    User.updateMany({}, { $set: { submittedBills: [] } }),
    AuditEvent.deleteMany({}),
    BillOCRResult.deleteMany({}),
    BillComment.deleteMany({}),
    EnhancedAuditLog.deleteMany({ entityType: "bill" }),
  ]);

  console.log(
    JSON.stringify(
      {
        deletedBills: billsResult.deletedCount,
        clearedUsersSubmittedBills: usersResult.modifiedCount,
        deletedAuditEvents: auditResult.deletedCount,
        deletedOcrResults: ocrResult.deletedCount,
        deletedBillComments: commentsResult.deletedCount,
        deletedBillAuditLogs: auditLogsResult.deletedCount,
      },
      null,
      2
    )
  );
}

run()
  .catch((error) => {
    console.error("Failed to clear bill data:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
