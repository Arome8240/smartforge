import fs from "fs";
import path from "path";
import solc from "solc";
import request from "sync-request";
import { log } from "./logger";

export interface CompileArtifacts {
    abi: any[];
    bytecode: string;
    contractName: string;
    warnings: any[];
}

const SOURCE_NAME = "Contract";
const OPENZEPPELIN_VERSION = process.env.OPENZEPPELIN_VERSION || "v5.0.2";
const OPENZEPPELIN_BASE_URL = `https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/${OPENZEPPELIN_VERSION}/`;
const NODE_MODULE_PATHS = [
    path.resolve(process.cwd(), "node_modules"),
    path.resolve(process.cwd(), "..", "node_modules"),
];

const importCache = new Map<string, string>();

function readFileIfExists(filePath: string) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, "utf8");
        }
    } catch (err) {
        log.warn(`Failed to read import ${filePath}: ${err}`);
    }
    return null;
}

function fetchRemoteFile(url: string) {
    try {
        const response = request("GET", url);
        if (response.statusCode >= 200 && response.statusCode < 300) {
            return response.getBody("utf8");
        }
    } catch (err) {
        log.warn(`Failed to download import from ${url}: ${err}`);
    }
    return null;
}

function resolveNodeModule(importPath: string) {
    for (const base of NODE_MODULE_PATHS) {
        const fullPath = path.resolve(base, importPath);
        const contents = readFileIfExists(fullPath);
        if (contents) {
            return contents;
        }
    }
    return null;
}

function resolveOpenZeppelin(importPath: string) {
    if (!importPath.startsWith("@openzeppelin/")) {
        return null;
    }

    const relativePath = importPath.replace("@openzeppelin/contracts/", "contracts/");
    const url = `${OPENZEPPELIN_BASE_URL}${relativePath}`;
    return fetchRemoteFile(url);
}

function resolveHttpImport(importPath: string) {
    if (!importPath.startsWith("http://") && !importPath.startsWith("https://")) {
        return null;
    }
    return fetchRemoteFile(importPath);
}

function findImports(importPath: string) {
    if (importCache.has(importPath)) {
        return { contents: importCache.get(importPath) as string };
    }

    const normalizedPath = importPath.replace(/^(\.\/)+/, "");
    const localAbsolute = path.resolve(process.cwd(), normalizedPath);
    let contents =
        readFileIfExists(localAbsolute) ||
        resolveNodeModule(importPath) ||
        resolveNodeModule(normalizedPath) ||
        resolveOpenZeppelin(importPath) ||
        resolveHttpImport(importPath);

    if (!contents && importPath.startsWith(".")) {
        const contractDir = path.resolve(process.cwd(), "contracts");
        const fallbackPath = path.resolve(contractDir, importPath);
        contents = readFileIfExists(fallbackPath);
    }

    if (!contents) {
        return { error: `File not found: ${importPath}` };
    }

    importCache.set(importPath, contents);
    return { contents };
}

export function compileSolidity(sourceCode: string): CompileArtifacts {
    if (!sourceCode) {
        throw new Error("sourceCode is required for compilation");
    }

    const input = {
        language: "Solidity",
        sources: {
            [SOURCE_NAME]: {
                content: sourceCode,
            },
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    const errors = output.errors?.filter((e: any) => e.severity === "error");

    if (errors?.length) {
        const message = errors.map((e: any) => e.formattedMessage || e.message).join("\n");
        throw new Error(`Solidity compilation failed:\n${message}`);
    }

    const contracts = output.contracts?.[SOURCE_NAME];
    if (!contracts) {
        throw new Error("No contracts were produced by the compiler");
    }

    const [contractName, contractData] = Object.entries<any>(contracts)[0];
    const bytecode = contractData.evm?.bytecode?.object;

    if (!bytecode) {
        throw new Error("Compiled contract is missing bytecode");
    }

    return {
        abi: contractData.abi,
        bytecode: "0x" + bytecode,
        contractName,
        warnings: output.errors?.filter((e: any) => e.severity === "warning") || [],
    };
}

export const SOLC_FULL_VERSION = `v${solc.version()}`;
