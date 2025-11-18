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

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
}

export interface DeploymentParams {
  networkConfig: NetworkConfig;
  sourceCode: string;
  privateKey: string;
  ownerAddress: string;
}

export async function deployToEVMNetwork(
  params: DeploymentParams
) {
  const { networkConfig, sourceCode, privateKey, ownerAddress } = params;

  if (!sourceCode) {
    throw new Error("Project has no sourceCode to deploy");
  }

  if (!privateKey || privateKey.trim() === "") {
    throw new Error("Private key is required for deployment");
  }

  if (!networkConfig.rpcUrl || networkConfig.rpcUrl.trim() === "") {
    throw new Error("RPC URL is required for deployment");
  }

  // Validate private key format
  const cleanPrivateKey = privateKey.startsWith("0x") 
    ? privateKey 
    : `0x${privateKey}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
    throw new Error("Invalid private key format. Expected 64 hex characters.");
  }

  log.info(`Compiling contract for deployment to ${networkConfig.name}...`);
  const { abi, bytecode, contractName } = compileContract(sourceCode);

  const provider = new JsonRpcProvider(networkConfig.rpcUrl, {
    chainId: networkConfig.chainId,
    name: networkConfig.name,
  });
  
  const wallet = new Wallet(cleanPrivateKey, provider);
  const deployerAddress = await wallet.getAddress();

  log.info(
    `Deploying contract ${contractName} from ${deployerAddress} on ${
      networkConfig.name
    } (Chain ID: ${networkConfig.chainId})...`
  );

  const factory = new ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  const tx = await contract.deploymentTransaction();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  // Try to transfer ownership / set owner to the project owner address if different
  if (ownerAddress.toLowerCase() !== deployerAddress.toLowerCase()) {
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
          "Contract does not expose transferOwnership/setOwner; owner is deployer."
        );
      }
    } catch (ownershipErr: any) {
      log.error(
        `Failed to transfer ownership to ${ownerAddress}: ${
          ownershipErr?.message || ownershipErr
        }`
      );
    }
  }

  log.success(
    `Deployed contract ${contractName} to ${address} on ${networkConfig.name}. Tx: ${
      tx?.hash || "unknown"
    }`
  );

  return {
    address,
    abi,
    network: networkConfig.name,
    chainId: networkConfig.chainId,
    txHash: tx?.hash || "",
  };
}
