import dotenv from "dotenv";
import app from "./app";
import { connectDatabase } from "./config/database";
import { log } from "./utils/logger";

dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(PORT, () => {
      log.success(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    log.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

startServer();
