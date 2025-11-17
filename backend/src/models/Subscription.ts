import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: "free" | "standard" | "premium";
  status: "active" | "cancelled" | "expired" | "pending_payment";
  paymentTxHash?: string;
  paymentAmount?: string; // USDC amount in smallest unit
  paymentCurrency?: string; // e.g., "USDC"
  paymentNetwork?: string; // e.g., "base-sepolia"
  circlePaymentId?: string; // Circle payment ID
  startDate: Date;
  endDate?: Date; // For monthly subscriptions
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "standard", "premium"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "pending_payment"],
      default: "pending_payment",
    },
    paymentTxHash: {
      type: String,
    },
    paymentAmount: {
      type: String,
    },
    paymentCurrency: {
      type: String,
      default: "USDC",
    },
    paymentNetwork: {
      type: String,
      default: "base-sepolia",
    },
    circlePaymentId: {
      type: String,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ circlePaymentId: 1 });

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
