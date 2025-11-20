import mongoose, { Schema, Document } from "mongoose";

export interface NetworkInfo {
    name: string;
    chainId: number;
    rpcUrl?: string;
}

export interface IProject extends Document {
    name: string;
    template: "ERC20" | "ERC721" | "Custom";
    owner: string; // Wallet address
    metadata?: Record<string, any>;
    abi?: any[];
    sourceCode?: string;
    deploymentStatus: "draft" | "deploying" | "deployed" | "failed";
    deployedAddress?: string;
    deployedNetwork?: NetworkInfo;
    targetNetwork?: NetworkInfo;
    verificationStatus?: "pending" | "success" | "failed";
    verificationGuid?: string;
    verificationMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: true,
        },
        template: {
            type: String,
            enum: ["ERC20", "ERC721", "Custom"],
            required: true,
        },
        owner: {
            type: String,
            required: true,
            index: true,
        },
        targetNetwork: {
            type: Schema.Types.Mixed,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        abi: {
            type: [Schema.Types.Mixed],
            default: [],
        },
        sourceCode: {
            type: String,
            default: "",
        },
        deploymentStatus: {
            type: String,
            enum: ["draft", "deploying", "deployed", "failed"],
            default: "draft",
        },
        deployedAddress: {
            type: String,
        },
        deployedNetwork: {
            type: Schema.Types.Mixed,
        },
        verificationStatus: {
            type: String,
            enum: ["pending", "success", "failed"],
        },
        verificationGuid: {
            type: String,
        },
        verificationMessage: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
ProjectSchema.index({ owner: 1, createdAt: -1 });

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
