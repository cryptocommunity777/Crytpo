const mongoose = require("mongoose");
const User = require("./models/User"); // adjust path if needed

(async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/YOUR_DB_NAME"); // replace with your DB URI

    const result = await User.updateMany(
      { walletAddress: "", walletAddress: { $ne: "" } },
      [{ $set: { walletAddress: "$walletAddress" } }] // note: aggregation pipeline syntax
    );

    console.log(`✅ Wallets migrated: ${result.modifiedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
})();
