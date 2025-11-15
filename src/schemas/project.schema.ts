import { z } from "zod";

export const ProjectTemplateSchema = z.enum(["ERC20", "ERC721", "Custom"]);

export const DeploymentStatusSchema = z.enum([
  "draft",
  "deploying",
  "deployed",
  "failed",
]);

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  template: ProjectTemplateSchema,
  owner: z.string(), // Wallet address
  metadata: z.record(z.any()).optional(),
  abi: z.array(z.any()).optional(),
  sourceCode: z.string().optional(),
  deploymentStatus: DeploymentStatusSchema.default("draft"),
  deployedAddress: z.string().optional(),
  deployedNetwork: z.string().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deploymentStatus: true,
});

export type ProjectTemplate = z.infer<typeof ProjectTemplateSchema>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
