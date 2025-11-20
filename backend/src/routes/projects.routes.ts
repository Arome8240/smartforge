import { Router } from "express";
import {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    deployProject,
    verifyProjectContract,
} from "../controllers/projects.controller";
import { authenticatePrivy } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticatePrivy);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/deploy", deployProject);
router.post("/:id/verify", verifyProjectContract);

export default router;
