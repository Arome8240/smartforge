import { z } from "zod";

export const ProjectTemplateSchema = z.enum(["ERC20", "ERC721", "Custom"]);

export const DeploymentStatusSchema = z.enum(["draft", "deploying", "deployed", "failed"]);

export const DeploymentNetworkIdSchema = z.enum(["base-sepolia", "base-mainnet"]);

export const NetworkInfoSchema = z.object({
    name: z.string(),
    chainId: z.number(),
    rpcUrl: z.string().optional(),
});

export const DeploymentNetworkSchema = z.union([DeploymentNetworkIdSchema, NetworkInfoSchema]);

export const ProjectSchema = z.object({
    _id: z.string(),
    name: z.string().min(1, "Project name is required"),
    template: ProjectTemplateSchema,
    owner: z.string(), // Wallet address
    metadata: z.record(z.any()).optional(),
    abi: z.array(z.any()).optional(),
    sourceCode: z.string().optional(),
    deploymentStatus: DeploymentStatusSchema.default("draft"),
    deployedAddress: z.string().optional(),
    deployedNetwork: DeploymentNetworkSchema.optional(),
    targetNetwork: DeploymentNetworkSchema.optional(),
    createdAt: z.date().or(z.string()),
    updatedAt: z.date().or(z.string()),
});

export const CreateProjectSchema = ProjectSchema.omit({
    _id: true,
    createdAt: true,
    updatedAt: true,
    deploymentStatus: true,
});

export type ProjectTemplate = z.infer<typeof ProjectTemplateSchema>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type DeploymentNetwork = z.infer<typeof DeploymentNetworkSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
