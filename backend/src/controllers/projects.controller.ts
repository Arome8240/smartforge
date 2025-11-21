import { Response } from "express";
import { Project } from "../models/Project";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { CONTRACT_TEMPLATES } from "../services/contract-templates";
import { log } from "../utils/logger";
import { deployToEVMNetwork, NetworkConfig } from "../services/deployment";
import { submitVerification, checkVerificationStatus } from "../services/verification";
import { compileSolidity } from "../utils/solidity";

export async function createProject(req: AuthRequest, res: Response) {
    try {
        const { name, template, sourceCode, targetNetwork } = req.body;
        const walletAddress = req.user!.walletAddress;

        // Get or create user
        // let user = await User.findOne({ walletAddress });

        let user = await User.findOne({
            $or: [{ walletAddress }, { privyUserId: req.user!.privyUserId }],
        });

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
                    error: "Free tier limit reached. Upgrade to Standard or Premium for more projects.",
                });
            }
        } else if (user.plan === "standard") {
            const projectCount = await Project.countDocuments({
                owner: walletAddress,
            });
            if (projectCount >= 10) {
                return res.status(403).json({
                    error: "Standard tier limit reached. Upgrade to Premium for unlimited projects.",
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
        res.status(500).json({ error: error.message || "Failed to create project" });
    }
}

export async function getProjects(req: AuthRequest, res: Response) {
    try {
        const walletAddress = req.user!.walletAddress;
        const projects = await Project.find({ owner: walletAddress }).sort({ createdAt: -1 }).lean();

        res.json(projects);
    } catch (error: any) {
        log.error(`Get projects error: ${error.message || error}`);
        res.status(500).json({ error: error.message || "Failed to fetch projects" });
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
        res.status(500).json({ error: error.message || "Failed to update project" });
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
        res.status(500).json({ error: error.message || "Failed to delete project" });
    }
}

export async function compileProject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const walletAddress = req.user!.walletAddress;

        const project = await Project.findOne({ _id: id, owner: walletAddress });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (!project.sourceCode) {
            return res.status(400).json({ error: "Project has no source code" });
        }

        const { abi, bytecode, contractName } = compileSolidity(project.sourceCode);

        res.json({
            abi,
            bytecode,
            contractName,
        });
    } catch (error: any) {
        log.error(`Compile project error: ${error.message || error}`);
        res.status(500).json({ error: error.message || "Failed to compile project" });
    }
}

export async function recordDeployment(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const walletAddress = req.user!.walletAddress;
        const { address, txHash, networkConfig } = req.body;

        if (!address || !txHash || !networkConfig) {
            return res.status(400).json({ error: "Missing deployment data" });
        }

        const project = await Project.findOne({ _id: id, owner: walletAddress });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Compile to get ABI
        const { abi } = compileSolidity(project.sourceCode || "");

        project.deploymentStatus = "deployed";
        project.deployedAddress = address;
        project.deployedNetwork = {
            name: networkConfig.name,
            chainId: networkConfig.chainId,
        };
        project.abi = abi;
        project.targetNetwork = networkConfig;
        await project.save();

        log.success(
            `Project ${project._id} deployed to ${networkConfig.name} (Chain ID: ${networkConfig.chainId}) at ${address} (tx: ${txHash})`
        );

        res.json({ message: "Deployment recorded", project });
    } catch (error: any) {
        log.error(`Record deployment error: ${error.message || error}`);
        res.status(500).json({ error: error.message || "Failed to record deployment" });
    }
}

export async function deployProject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const walletAddress = req.user!.walletAddress;
        const { networkConfig } = req.body;

        const project = await Project.findOne({ _id: id, owner: walletAddress });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Validate network config
        if (!networkConfig || !networkConfig.name || !networkConfig.rpcUrl || !networkConfig.chainId) {
            return res.status(400).json({
                error: "Network configuration is required (name, rpcUrl, chainId)",
            });
        }

        if (!req.privyToken) {
            return res.status(401).json({ error: "Privy token missing from request" });
        }

        // Update status to deploying
        project.deploymentStatus = "deploying";
        project.targetNetwork = networkConfig;
        await project.save();

        // Kick off real deployment (non-blocking)
        (async () => {
            try {
                if (!req.privyToken) {
                    return res.status(401).json({ error: "Privy token missing from request" });
                }
                const privyToken = req.privyToken;

                //console.log(privyToken);

                const { address, abi, network, chainId, txHash } = await deployToEVMNetwork({
                    networkConfig,
                    sourceCode: project.sourceCode || "",
                    ownerAddress: project.owner,
                    privyToken,
                });

                project.deploymentStatus = "deployed";
                project.deployedAddress = address;
                project.deployedNetwork = { name: network, chainId };
                project.abi = abi;
                project.verificationStatus = undefined;
                project.verificationGuid = undefined;
                project.verificationMessage = undefined;
                await project.save();

                log.success(
                    `Project ${project._id} deployed to ${network} (Chain ID: ${chainId}) at ${address} (tx: ${txHash})`
                );
            } catch (err: any) {
                log.error(`Deployment failed for project ${project._id}: ${err?.message || err}`);
                project.deploymentStatus = "failed";
                await project.save();
            }
        })();

        res.json({ message: "Deployment started", project });
    } catch (error: any) {
        log.error(`Deploy project error: ${error.message || error}`);
        res.status(500).json({ error: error.message || "Failed to deploy project" });
    }
}

export async function verifyProjectContract(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const walletAddress = req.user!.walletAddress;

        const project = await Project.findOne({ _id: id, owner: walletAddress });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (project.deploymentStatus !== "deployed" || !project.deployedAddress) {
            return res.status(400).json({ error: "Deploy the contract before verifying it." });
        }

        const deployedNetwork = project.deployedNetwork as { chainId?: number; name?: string } | string | undefined;

        log.info(`Verifying contract for project ${project._id}. Deployed network: ${JSON.stringify(deployedNetwork)}`);

        if (!deployedNetwork) {
            log.error(`No deployed network information found for project ${project._id}`);
            return res.status(400).json({
                error: "No network information found. Please redeploy the contract.",
            });
        }

        let chainId: number | undefined;

        if (typeof deployedNetwork === "object" && deployedNetwork?.chainId) {
            chainId = deployedNetwork.chainId;
            log.info(`Extracted chainId from object: ${chainId}`);
        } else if (typeof deployedNetwork === "string") {
            const networkName = deployedNetwork.toLowerCase();
            log.info(`Deployed network is string: ${networkName}`);
            if (networkName.includes("base") && networkName.includes("mainnet")) {
                chainId = 8453;
            } else if (networkName.includes("base") && networkName.includes("sepolia")) {
                chainId = 84532;
            }
        }

        if (!chainId) {
            log.error(
                `Unable to determine chainId. deployedNetwork type: ${typeof deployedNetwork}, value: ${JSON.stringify(deployedNetwork)}`
            );
            return res.status(400).json({
                error: `Unable to determine chain ID from deployed network. Network info: ${JSON.stringify(deployedNetwork)}`,
            });
        }

        log.info(`Chain ID determined: ${chainId}`);

        if (![8453, 84532].includes(chainId)) {
            return res.status(400).json({
                error: `Verification is currently supported only for Base networks. Current chain ID: ${chainId}`,
            });
        }

        const sourceCode =
            project.sourceCode || CONTRACT_TEMPLATES[project.template as keyof typeof CONTRACT_TEMPLATES];

        if (!sourceCode) {
            return res.status(400).json({ error: "No contract source code found." });
        }

        const { contractName } = compileSolidity(sourceCode);

        project.verificationStatus = "pending";
        project.verificationMessage = "Submitting verification to BaseScan...";
        await project.save();

        const { guid, endpoint } = await submitVerification({
            address: project.deployedAddress,
            chainId,
            contractName,
            sourceCode,
        });

        project.verificationGuid = guid;
        project.verificationMessage = "Verification submitted. Awaiting result...";
        await project.save();

        (async () => {
            try {
                const apiKey =
                    chainId === 84532
                        ? process.env.BASESCAN_SEPOLIA_API_KEY || process.env.BASESCAN_API_KEY
                        : process.env.BASESCAN_API_KEY;

                if (!apiKey) {
                    throw new Error("BaseScan API key is not configured");
                }

                for (let attempt = 0; attempt < 20; attempt++) {
                    await new Promise((resolve) => setTimeout(resolve, 7000));
                    const status = await checkVerificationStatus(endpoint, apiKey, guid);

                    if (status.status === "pending") {
                        continue;
                    }

                    project.verificationStatus = status.status;
                    project.verificationMessage = status.message;
                    await project.save();
                    return;
                }

                project.verificationStatus = "failed";
                project.verificationMessage = "Verification timed out. Please try again.";
                await project.save();
            } catch (error: any) {
                project.verificationStatus = "failed";
                project.verificationMessage = error?.message || "Verification failed unexpectedly.";
                await project.save();
            }
        })();

        res.json({
            message: "Verification started",
            guid,
        });
    } catch (error: any) {
        log.error(`Verify project error: ${error.message || error}`);
        res.status(500).json({ error: error.message || "Failed to verify contract" });
    }
}
