import { Router } from "express";
import {
  getSubscription,
  createPaymentIntent,
  verifyPayment,
  cancelSubscription,
} from "../controllers/subscriptions.controller";
import { authenticatePrivy } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticatePrivy);

router.get("/", getSubscription);
router.post("/payment-intent", createPaymentIntent);
router.post("/verify-payment", verifyPayment);
router.post("/cancel", cancelSubscription);

export default router;
