import { Router } from "express";
import { authenticatePrivy } from "../middleware/auth";
import { compileContract } from "../controllers/compile.controller";

const router = Router();

// All routes require authentication
router.use(authenticatePrivy);

// POST /api/compile - Compile Solidity code
router.post("/", compileContract);

export default router;
