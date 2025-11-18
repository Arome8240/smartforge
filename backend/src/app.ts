import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import projectsRoutes from "./routes/projects.routes";
import subscriptionsRoutes from "./routes/subscriptions.routes";
import compileRoutes from "./routes/compile.routes";
import aiRoutes from "./routes/ai.routes";
import { httpLogger, log } from "./utils/logger";

const app = express();

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3001",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(httpLogger);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/compile", compileRoutes);
app.use("/api/ai", aiRoutes);

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    log.error(err.message || "Internal server error");
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
    });
  }
);

export default app;
