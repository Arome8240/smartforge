import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { generateCode, improveCode } from "../controllers/ai.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/ai/generate - Generate Solidity code from prompt
router.post("/generate", generateCode);

// POST /api/ai/improve - Improve existing Solidity code
router.post("/improve", improveCode);

export default router;
