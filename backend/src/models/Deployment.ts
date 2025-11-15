import mongoose, { Schema, Document } from "mongoose";

export interface IDeployment extends Document {
  projectId: mongoose.Types.ObjectId;
  network: string;
  contractAddress: string;
  transactionHash: string;
  status: "pending" | "success" | "failed";
  gasUsed?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeployment>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    network: {
      type: String,
      required: true,
    },
    contractAddress: {
      type: String,
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    gasUsed: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Deployment = mongoose.model<IDeployment>(
  "Deployment",
  DeploymentSchema
);
