import { log } from "../utils/logger";
import { JsonRpcProvider, Wallet, ContractFactory, Contract } from "ethers";
import solc from "solc";

interface CompileResult {
  abi: any[];
  bytecode: string;
  contractName: string;
}

function compileContract(sourceCode: string): CompileResult {
  const input = {
    language: "Solidity",
    sources: {
      Contract: {
        content: sourceCode,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  /*
  I want it to be able to deploy to all EVM compatible Networks, And it should pop a field for deployer to add their privateKey so that their private will be used for the deployment and the contract will be assigned to the owner of the private key
  */

  // Note: we deliberately avoid using the import callback / multiple compiler stacks
  // to prevent the "You shall not have another CompilerStack aside me" error.
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors && output.errors.length > 0) {
    const hasError = output.errors.some((e: any) => e.severity === "error");
    if (hasError) {
      const message = output.errors
        .map((e: any) => e.formattedMessage || e.message)
        .join("\n");
      throw new Error(`Solidity compilation failed:\n${message}`);
    }
  }

  const contracts = output.contracts?.Contract;
  if (!contracts) {
    throw new Error("No contracts found in compilation output");
  }

  const [contractName, contractData] = Object.entries<any>(contracts)[0];
  const bytecode = contractData.evm?.bytecode?.object;

  if (!bytecode) {
    throw new Error("Compiled contract has no bytecode");
  }

  return {
    abi: contractData.abi,
    bytecode: "0x" + bytecode,
    contractName,
  };
}

type BaseNetworkConfig = {
  label: string;
  rpcEnv: string;
  privateKeyEnv: string;
  fallbackRpc?: string;
};

const BASE_NETWORK_CONFIG: Record<
  "base-sepolia" | "base-mainnet",
  BaseNetworkConfig
> = {
  "base-sepolia": {
    label: "Base Sepolia",
    rpcEnv: "BASE_SEPOLIA_RPC_URL",
    privateKeyEnv: "BASE_SEPOLIA_DEPLOYER_KEY",
    fallbackRpc: "https://sepolia.base.org",
  },
  "base-mainnet": {
    label: "Base Mainnet",
    rpcEnv: "BASE_MAINNET_RPC_URL",
    privateKeyEnv: "BASE_MAINNET_DEPLOYER_KEY",
  },
} as const;

export type BaseNetworkKey = keyof typeof BASE_NETWORK_CONFIG;

export async function deployToBaseNetwork(
  network: BaseNetworkKey,
  sourceCode: string,
  ownerAddress: string
) {
  if (!sourceCode) {
    throw new Error("Project has no sourceCode to deploy");
  }

  const config = BASE_NETWORK_CONFIG[network];
  if (!config) {
    throw new Error(`Unsupported Base network: ${network}`);
  }

  const rpcUrl =
    process.env[config.rpcEnv as keyof NodeJS.ProcessEnv] || config.fallbackRpc;
  const privateKey =
    process.env[config.privateKeyEnv as keyof NodeJS.ProcessEnv];

  if (!privateKey) {
    throw new Error(
      `${config.privateKeyEnv} is not set in environment variables`
    );
  }

  if (!rpcUrl) {
    throw new Error(
      `${config.rpcEnv} is not set in environment variables and no fallback RPC is available`
    );
  }

  log.info(`Compiling contract for deployment to ${config.label}...`);
  const { abi, bytecode, contractName } = compileContract(sourceCode);

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);

  log.info(
    `Deploying contract ${contractName} from ${await wallet.getAddress()} on ${
      config.label
    }...`
  );

  const factory = new ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  const tx = await contract.deploymentTransaction();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  // Try to transfer ownership / set owner to the project owner address
  try {
    const instance = new Contract(address, abi, wallet);
    const anyInstance = instance as any;

    if (typeof anyInstance.transferOwnership === "function") {
      log.info(
        `Transferring ownership of ${contractName} at ${address} to ${ownerAddress}...`
      );
      const txOwn = await anyInstance.transferOwnership(ownerAddress);
      await txOwn.wait();
      log.success(`Ownership transferred to ${ownerAddress}`);
    } else if (typeof anyInstance.setOwner === "function") {
      log.info(
        `Setting owner of ${contractName} at ${address} to ${ownerAddress}...`
      );
      const txOwn = await anyInstance.setOwner(ownerAddress);
      await txOwn.wait();
      log.success(`Owner set to ${ownerAddress}`);
    } else {
      log.info(
        "Contract does not expose transferOwnership/setOwner; leaving deployer as owner."
      );
    }
  } catch (ownershipErr: any) {
    log.error(
      `Failed to transfer ownership to ${ownerAddress}: ${
        ownershipErr?.message || ownershipErr
      }`
    );
  }

  log.success(
    `Deployed contract ${contractName} to ${address} on ${config.label}. Tx: ${
      tx?.hash || "unknown"
    }`
  );

  return {
    address,
    abi,
    network,
    txHash: tx?.hash || "",
  };
}
