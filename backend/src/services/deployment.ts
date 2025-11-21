import { Contract, ContractFactory, JsonRpcProvider } from "ethers";
import { compileSolidity } from "../utils/solidity";
import { privyClient } from "../lib/privy";
import { log } from "../utils/logger";

export interface NetworkConfig {
    name: string;
    rpcUrl: string;
    chainId: number;
}

export interface DeploymentParams {
    networkConfig: NetworkConfig;
    sourceCode: string;
    ownerAddress: string;
    privyToken: string;
}

const toHex = (value?: bigint | null) => {
    if (value === undefined || value === null) return undefined;
    return `0x${value.toString(16)}`;
};

export async function deployToEVMNetwork(params: DeploymentParams) {
    const { networkConfig, sourceCode, ownerAddress, privyToken } = params;

    const walletAddress = ownerAddress;

    if (!walletAddress || !walletAddress.startsWith("0x")) {
        throw new Error("Invalid owner address on project");
    }

    if (!sourceCode) {
        throw new Error("Project has no sourceCode to deploy");
    }

    if (!privyToken) {
        throw new Error("Privy token is required for deployment");
    }

    if (!networkConfig.rpcUrl || networkConfig.rpcUrl.trim() === "") {
        throw new Error("RPC URL is required for deployment");
    }

    log.info(`Compiling contract for deployment to ${networkConfig.name}...`);
    const { abi, bytecode, contractName } = compileSolidity(sourceCode);

    const provider = new JsonRpcProvider(networkConfig.rpcUrl, {
        chainId: networkConfig.chainId,
        name: networkConfig.name,
    });

    const factory = new ContractFactory(abi, bytecode);
    const deployTx = await factory.getDeployTransaction();
    const deployData = deployTx.data || bytecode;

    const gasEstimate = await provider.estimateGas({
        from: walletAddress,
        data: deployData,
    });
    const feeData = await provider.getFeeData();

    const auth = await privyClient.utils().auth().verifyAuthToken(privyToken);

    if (!auth) {
        throw new Error("Failed to authenticate Privy wallet for deployment");
    }

    const user = await privyClient.users()._get(auth.user_id);

    const walletId = user.linked_accounts.find((account) => account.type === "wallet" && "id" in account)?.id;

    if (!walletId) {
        throw new Error("No wallet ID found for user");
    }

    const transaction = {
        chain_id: networkConfig.chainId,
        from: walletAddress,
        data: deployData,
        gas_limit: toHex(gasEstimate),
        max_fee_per_gas: toHex(feeData.maxFeePerGas ?? undefined),
        max_priority_fee_per_gas: toHex(feeData.maxPriorityFeePerGas ?? undefined),
        value: "0x0",
    };

    log.info(
        `Deploying contract ${contractName} from ${walletAddress} on ${networkConfig.name} (Chain ID: ${networkConfig.chainId})...`
    );

    const response = await privyClient.wallets()._rpc(walletId, {
        method: "eth_sendTransaction",
        caip2: `eip155:${networkConfig.chainId}`,
        params: { transaction },
    });

    const txHash = (response.data as any)?.hash || (response.data as any)?.transaction_request?.hash || "";

    if (!txHash) {
        throw new Error("Privy did not return a transaction hash");
    }

    const receipt = await provider.waitForTransaction(txHash);
    const address = receipt?.contractAddress;

    if (!address) {
        throw new Error("Failed to determine deployed contract address");
    }

    try {
        const instance = new Contract(address, abi, provider);
        const anyInstance = instance as any;

        if (typeof anyInstance.transferOwnership === "function") {
            log.info(`Transferring ownership of ${contractName} at ${address} to ${walletAddress}...`);
            await privyClient.wallets()._rpc(walletId, {
                method: "eth_sendTransaction",
                caip2: `eip155:${networkConfig.chainId}`,
                params: {
                    transaction: {
                        chain_id: networkConfig.chainId,
                        from: walletAddress,
                        to: address,
                        data: anyInstance.interface.encodeFunctionData("transferOwnership", [walletAddress]),
                        gas_limit: toHex(BigInt(150000)),
                    },
                },
            });
            log.success(`Ownership transferred to ${walletAddress}`);
        }
    } catch (ownershipErr: any) {
        log.warn(`Could not automatically transfer ownership: ${ownershipErr?.message || ownershipErr}`);
    }

    log.success(`Deployed contract ${contractName} to ${address} on ${networkConfig.name}. Tx: ${txHash}`);

    return {
        address,
        abi,
        network: networkConfig.name,
        chainId: networkConfig.chainId,
        txHash,
    };
}
