const mongoose = require("mongoose");
const { initDatabase, Bill, User } = require("../db");

async function run() {
  await initDatabase();

  const billsResult = await Bill.collection.updateMany(
    { session_id: { $exists: true } },
    { $unset: { session_id: "" } }
  );

  const usersResult = await User.collection.updateMany(
    { "submittedBills.session_id": { $exists: true } },
    { $unset: { "submittedBills.$[].session_id": "" } }
  );

  const remainingBills = await Bill.collection.countDocuments({ session_id: { $exists: true } });
  const remainingUsers = await User.collection.countDocuments({ "submittedBills.session_id": { $exists: true } });

  console.log(
    `Cleanup complete. BillsMatched: ${billsResult.matchedCount}, BillsModified: ${billsResult.modifiedCount}, UsersMatched: ${usersResult.matchedCount}, UsersModified: ${usersResult.modifiedCount}, RemainingBillsWithSession_id: ${remainingBills}, RemainingUsersWithSession_id: ${remainingUsers}`
  );
}

run()
  .catch((err) => {
    console.error("Cleanup failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
