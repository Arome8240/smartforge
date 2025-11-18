import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { compileContract } from "../controllers/compile.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/compile - Compile Solidity code
router.post("/", compileContract);

export default router;
