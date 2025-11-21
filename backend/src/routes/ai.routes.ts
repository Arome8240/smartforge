import { Router } from "express";
import { authenticatePrivy } from "../middleware/auth";
import { generateCode, improveCode } from "../controllers/ai.controller";

const router = Router();

// All routes require authentication
router.use(authenticatePrivy);

// POST /api/ai/generate - Generate Solidity code from prompt
router.post("/generate", generateCode);

// POST /api/ai/improve - Improve existing Solidity code
router.post("/improve", improveCode);

export default router;
