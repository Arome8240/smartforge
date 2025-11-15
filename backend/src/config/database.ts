import mongoose from "mongoose";
import { log } from "../utils/logger";

export async function connectDatabase() {
  const mongoUri =
    process.env.MONGODB_URI ||
    "mongodb+srv://voiceoftruth:votarkinen@cluster0.iy5o3.mongodb.net/?appName=Cluster0";

  try {
    await mongoose.connect(mongoUri);
    log.success("✅ Connected to MongoDB");
  } catch (error) {
    log.error(`❌ MongoDB connection error: ${error}`);
    throw error;
  }
}
