import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/smartforge";

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}
