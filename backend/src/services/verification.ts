import axios from "axios";
import { SOLC_FULL_VERSION } from "../utils/solidity";
import { log } from "../utils/logger";

const BASESCAN_ENDPOINTS: Record<number, string> = {
    8453: "https://api.basescan.org/api",
    84532: "https://api-sepolia.basescan.org/api",
};

const API_KEY_MAP: Record<number, string | undefined> = {
    8453: process.env.BASESCAN_API_KEY,
    84532: process.env.BASESCAN_SEPOLIA_API_KEY || process.env.BASESCAN_API_KEY,
};

export interface VerificationParams {
    chainId: number;
    address: string;
    contractName: string;
    sourceCode: string;
    constructorArgs?: string;
    licenseType?: number;
    optimizationRuns?: number;
}

export interface VerificationSubmission {
    guid: string;
    endpoint: string;
}

export async function submitVerification(params: VerificationParams): Promise<VerificationSubmission> {
    const endpoint = BASESCAN_ENDPOINTS[params.chainId];
    const apiKey = API_KEY_MAP[params.chainId];

    if (!endpoint || !apiKey) {
        throw new Error("BaseScan verification is only supported on Base networks");
    }

    const form = new URLSearchParams({
        apikey: apiKey,
        module: "contract",
        action: "verifysourcecode",
        contractaddress: params.address,
        sourceCode: params.sourceCode,
        codeformat: "solidity-single-file",
        contractname: `Contract:${params.contractName}`,
        compilerversion: SOLC_FULL_VERSION,
        optimizationUsed: "1",
        runs: String(params.optimizationRuns ?? 200),
        constructorArguements: params.constructorArgs || "",
        licenseType: String(params.licenseType ?? 3),
    });

    const { data } = await axios.post(endpoint, form);

    if (data.status !== "1") {
        throw new Error(data?.result || "BaseScan verification submission failed");
    }

    log.info(`Submitted verification request to BaseScan: ${data.result}`);

    return {
        guid: data.result,
        endpoint,
    };
}

export interface VerificationStatus {
    status: "pending" | "success" | "failed";
    message: string;
}

export async function checkVerificationStatus(
    endpoint: string,
    apiKey: string,
    guid: string
): Promise<VerificationStatus> {
    const { data } = await axios.get(endpoint, {
        params: {
            apikey: apiKey,
            module: "contract",
            action: "checkverifystatus",
            guid,
        },
    });

    if (data.status === "1") {
        return { status: "success", message: data.result };
    }

    const result = (data.result as string)?.toLowerCase() || "";

    if (result.includes("pending")) {
        return { status: "pending", message: data.result };
    }

    return {
        status: "failed",
        message: data.result || "Verification failed",
    };
}
