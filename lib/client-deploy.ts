import { BrowserProvider, Contract, ContractFactory } from "ethers";

export interface ClientDeploymentParams {
    bytecode: string;
    abi: any[];
    chainId: number;
    rpcUrl: string;
    provider: any; // Privy's EIP-1193 provider
}

export interface DeploymentResult {
    address: string;
    txHash: string;
    receipt: any;
}

/**
 * Deploy a contract using the user's Privy embedded wallet
 * This runs entirely client-side with the user signing the transaction
 */
export async function deployContractClientSide(params: ClientDeploymentParams): Promise<DeploymentResult> {
    const { bytecode, abi, chainId, rpcUrl, provider } = params;

    if (!provider) {
        throw new Error("No wallet provider available");
    }

    // Create ethers provider from Privy's EIP-1193 provider
    const ethersProvider = new BrowserProvider(provider);

    // Get the signer (user's wallet)
    const signer = await ethersProvider.getSigner();
    const signerAddress = await signer.getAddress();

    console.log("Deploying from:", signerAddress);

    // Ensure we're on the correct network
    const network = await ethersProvider.getNetwork();
    if (Number(network.chainId) !== chainId) {
        throw new Error(`Wrong network. Please switch to chain ID ${chainId}. Currently on ${network.chainId}`);
    }

    // Create contract factory
    const factory = new ContractFactory(abi, bytecode, signer);

    // Deploy the contract
    console.log("Deploying contract...");
    const contract = await factory.deploy();

    // Wait for deployment
    console.log("Waiting for deployment transaction...");
    const deploymentTx = contract.deploymentTransaction();
    if (!deploymentTx) {
        throw new Error("No deployment transaction found");
    }

    // Wait for the transaction to be mined
    const receipt = await deploymentTx.wait();
    if (!receipt) {
        throw new Error("Transaction receipt not found");
    }

    const address = await contract.getAddress();
    console.log("Contract deployed at:", address);

    return {
        address,
        txHash: deploymentTx.hash,
        receipt,
    };
}

/**
 * Transfer ownership of a contract to a specific address
 */
export async function transferOwnership(
    contractAddress: string,
    newOwner: string,
    abi: any[],
    provider: any
): Promise<string> {
    const ethersProvider = new BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    const contract = new Contract(contractAddress, abi, signer);

    // Check if contract has transferOwnership function
    if (typeof contract.transferOwnership !== "function") {
        throw new Error("Contract does not have transferOwnership function");
    }

    console.log(`Transferring ownership to ${newOwner}...`);
    const tx = await contract.transferOwnership(newOwner);
    const receipt = await tx.wait();

    console.log("Ownership transferred:", receipt.hash);
    return receipt.hash;
}
