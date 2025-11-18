import { Response } from "express";
import { Project } from "../models/Project";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { CONTRACT_TEMPLATES } from "../services/contract-templates";
import { log } from "../utils/logger";
import { deployToEVMNetwork, NetworkConfig } from "../services/deployment";

export async function createProject(req: AuthRequest, res: Response) {
  try {
    const { name, template, sourceCode, targetNetwork } = req.body;
    const walletAddress = req.user!.walletAddress;

    // Get or create user
    let user = await User.findOne({ walletAddress });
    if (!user) {
      user = await User.create({
        walletAddress,
        privyUserId: req.user!.privyUserId,
        plan: "free",
      });
    }

    // Check project limit based on plan
    if (user.plan === "free") {
      const projectCount = await Project.countDocuments({
        owner: walletAddress,
      });
      if (projectCount >= 1) {
        return res.status(403).json({
          error:
            "Free tier limit reached. Upgrade to Standard or Premium for more projects.",
        });
      }
    } else if (user.plan === "standard") {
      const projectCount = await Project.countDocuments({
        owner: walletAddress,
      });
      if (projectCount >= 10) {
        return res.status(403).json({
          error:
            "Standard tier limit reached. Upgrade to Premium for unlimited projects.",
        });
      }
    }
    // Premium plan has unlimited projects

    const project = await Project.create({
      name,
      template,
      owner: walletAddress,
      targetNetwork,
      sourceCode:
        sourceCode ||
        CONTRACT_TEMPLATES[template as keyof typeof CONTRACT_TEMPLATES] ||
        CONTRACT_TEMPLATES.Custom,
      deploymentStatus: "draft",
    });

    res.status(201).json(project);
  } catch (error: any) {
    log.error(`Create project error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to create project" });
  }
}

export async function getProjects(req: AuthRequest, res: Response) {
  try {
    const walletAddress = req.user!.walletAddress;
    const projects = await Project.find({ owner: walletAddress })
      .sort({ createdAt: -1 })
      .lean();

    res.json(projects);
  } catch (error: any) {
    log.error(`Get projects error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch projects" });
  }
}

export async function getProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const walletAddress = req.user!.walletAddress;

    const project = await Project.findOne({ _id: id, owner: walletAddress });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error: any) {
    log.error(`Get project error: ${error.message || error}`);
    res.status(500).json({ error: error.message || "Failed to fetch project" });
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const walletAddress = req.user!.walletAddress;
    const updates = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: id, owner: walletAddress },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error: any) {
    log.error(`Update project error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to update project" });
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const walletAddress = req.user!.walletAddress;

    const project = await Project.findOneAndDelete({
      _id: id,
      owner: walletAddress,
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    log.error(`Delete project error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to delete project" });
  }
}

export async function deployProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const walletAddress = req.user!.walletAddress;
    const { networkConfig, privateKey } = req.body;

    const project = await Project.findOne({ _id: id, owner: walletAddress });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Validate network config
    if (!networkConfig || !networkConfig.name || !networkConfig.rpcUrl || !networkConfig.chainId) {
      return res.status(400).json({ 
        error: "Network configuration is required (name, rpcUrl, chainId)" 
      });
    }

    // Validate private key
    if (!privateKey || privateKey.trim() === "") {
      return res.status(400).json({ 
        error: "Private key is required for deployment" 
      });
    }

    // Update status to deploying
    project.deploymentStatus = "deploying";
    project.targetNetwork = networkConfig;
    await project.save();

    // Kick off real deployment (non-blocking)
    (async () => {
      try {
        const { address, abi, network, chainId, txHash } = await deployToEVMNetwork({
          networkConfig,
          sourceCode: project.sourceCode || "",
          privateKey,
          ownerAddress: project.owner,
        });

        project.deploymentStatus = "deployed";
        project.deployedAddress = address;
        project.deployedNetwork = { name: network, chainId };
        project.abi = abi;
        await project.save();

        log.success(
          `Project ${project._id} deployed to ${network} (Chain ID: ${chainId}) at ${address} (tx: ${txHash})`
        );
      } catch (err: any) {
        log.error(
          `Deployment failed for project ${project._id}: ${err?.message || err}`
        );
        project.deploymentStatus = "failed";
        await project.save();
      }
    })();

    res.json({ message: "Deployment started", project });
  } catch (error: any) {
    log.error(`Deploy project error: ${error.message || error}`);
    res
      .status(500)
      .json({ error: error.message || "Failed to deploy project" });
  }
}
