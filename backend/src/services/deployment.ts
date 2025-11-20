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

    //console.log("Wallet address:", walletAddress, ownerAddress);

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

    //console.log("Compiled contract:", networkConfig);

    const provider = new JsonRpcProvider(networkConfig.rpcUrl, {
        chainId: networkConfig.chainId,
        name: networkConfig.name,
    });

    console.log("Provider network:", await provider.getNetwork());

    const factory = new ContractFactory(abi, bytecode);
    const deployTx = await factory.getDeployTransaction();
    const deployData = deployTx.data || bytecode;

    const gasEstimate = await provider.estimateGas({
        from: walletAddress,
        data: deployData,
    });
    const feeData = await provider.getFeeData();

    console.log("Privy token:", privyToken);

    const auth = await privyClient.utils().auth().verifyAuthToken(privyToken);

    if (!auth) {
        throw new Error("Failed to authenticate Privy wallet for deployment");
    }

    console.log("Auth data:", auth);

    const authorizationKey = "authorization_key" in auth ? auth.authorization_key : undefined;

    if (!authorizationKey) {
        throw new Error("Unable to authorize Privy wallet for deployment");
    }

    // const wallet =
    //     auth.wallets.find(
    //         (w) => w.chain_type === "ethereum" && w.address?.toLowerCase() === walletAddress.toLowerCase()
    //     ) || auth.wallets.find((w) => w.chain_type === "ethereum");

    const user = await privyClient.users()._get(auth.user_id);

    const walletAccount = user.linked_accounts?.find((acc: any) => acc.address || acc.type === "wallet");
    console.log("Wallet account:", walletAccount);
    if (!walletAddress) {
        throw new Error("No Ethereum wallet linked to this Privy account");
    }

    //const walletAddres = (user as any)?..linked_accounts[1];

    log.info(
        `Deploying contract ${contractName} from ${walletAddress} on ${networkConfig.name} (Chain ID: ${networkConfig.chainId})...`
    );

    const transaction = {
        chain_id: networkConfig.chainId,
        from: walletAddress,
        data: deployData,
        gas_limit: toHex(gasEstimate),
        max_fee_per_gas: toHex(feeData.maxFeePerGas ?? undefined),
        max_priority_fee_per_gas: toHex(feeData.maxPriorityFeePerGas ?? undefined),
        value: "0x0",
    };

    const response = await privyClient.wallets()._rpc(user.id, {
        method: "eth_sendTransaction",
        caip2: `eip155:${networkConfig.chainId}`,
        params: { transaction },
        //"privy-authorization-signature": { authorizationKey : { authorizationKey } },
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
            await privyClient.wallets()._rpc(user.id, {
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
                // "privy-authorization-signature": authorizationKey,
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
