import { Response } from "express";
import { User } from "../models/User";
import { Subscription } from "../models/Subscription";
import { AuthRequest } from "../middleware/auth";
import { log } from "../utils/logger";
import {
  verifyPaymentTransaction,
  getPlanPrice,
} from "../services/payment-verification";

export async function getSubscription(req: AuthRequest, res: Response) {
  try {
    const walletAddress = req.user!.walletAddress;

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ["active", "pending_payment"] },
    }).sort({ createdAt: -1 });

    res.json({
      plan: user.plan,
      subscription: subscription
        ? {
            id: subscription._id,
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            autoRenew: subscription.autoRenew,
          }
        : null,
    });
  } catch (error: any) {
    log.error(`Get subscription error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch subscription" });
  }
}

export async function createPaymentIntent(req: AuthRequest, res: Response) {
  try {
    const { plan } = req.body;
    const walletAddress = req.user!.walletAddress;

    if (!plan || !["standard", "premium"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const amount = getPlanPrice(plan);

    // Create pending subscription (payment will be verified after transaction)
    const subscription = await Subscription.create({
      userId: user._id,
      plan,
      status: "pending_payment",
      paymentAmount: amount,
      paymentCurrency: "USDC",
      paymentNetwork: "base-sepolia",
      startDate: new Date(),
      autoRenew: true,
    });

    res.json({
      subscriptionId: subscription._id,
      amount,
      currency: "USDC",
      network: "base-sepolia",
      recipientAddress:
        process.env.PAYMENT_RECIPIENT_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    });
  } catch (error: any) {
    log.error(`Create payment intent error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to create payment intent" });
  }
}

export async function verifyPayment(req: AuthRequest, res: Response) {
  try {
    const { subscriptionId, txHash } = req.body;
    const walletAddress = req.user!.walletAddress;

    if (!txHash) {
      return res.status(400).json({ error: "Transaction hash is required" });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId: user._id,
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Verify on-chain transaction
    const expectedAmount =
      subscription.paymentAmount ||
      (subscription.plan !== "free" ? getPlanPrice(subscription.plan) : "0.00");
    const verification = await verifyPaymentTransaction(
      txHash,
      expectedAmount,
      walletAddress
    );

    if (verification.confirmed) {
      // Update subscription to active
      subscription.status = "active";
      subscription.paymentTxHash = txHash;
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
      subscription.endDate = endDate;
      await subscription.save();

      // Update user plan
      user.plan = subscription.plan;
      await user.save();

      // Cancel any other active subscriptions
      await Subscription.updateMany(
        {
          userId: user._id,
          _id: { $ne: subscription._id },
          status: "active",
        },
        { status: "cancelled" }
      );

      log.success(
        `Subscription activated for user ${walletAddress}: ${subscription.plan} (tx: ${txHash})`
      );
    } else {
      log.warn(
        `Payment verification failed for subscription ${subscriptionId} (tx: ${txHash})`
      );
    }

    res.json({
      confirmed: verification.confirmed,
      amount: verification.amount,
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (error: any) {
    log.error(`Verify payment error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to verify payment" });
  }
}

export async function cancelSubscription(req: AuthRequest, res: Response) {
  try {
    const walletAddress = req.user!.walletAddress;

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    subscription.status = "cancelled";
    subscription.autoRenew = false;
    await subscription.save();

    // Downgrade user to free plan
    user.plan = "free";
    await user.save();

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error: any) {
    log.error(`Cancel subscription error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to cancel subscription" });
  }
}
