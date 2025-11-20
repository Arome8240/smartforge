import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { log } from "../utils/logger";
import { compileSolidity } from "../utils/solidity";
import axios from "axios";

async function importResolver(path: string): Promise<{ contents?: string }> {
    try {
        // OpenZeppelin
        if (path.startsWith("@openzeppelin")) {
            const url = `https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/${path.replace("@openzeppelin/", "")}`;
            const { data } = await axios.get(url);
            return { contents: data };
        }

        // Chainlink
        if (path.startsWith("@chainlink")) {
            const url = `https://raw.githubusercontent.com/smartcontractkit/chainlink/develop/contracts/${path.replace("@chainlink/contracts/", "")}`;
            const { data } = await axios.get(url);
            return { contents: data };
        }

        // NPM style imports from GitHub
        if (path.startsWith("github.com")) {
            const url = `https://${path}`;
            const { data } = await axios.get(url);
            return { contents: data };
        }

        return { error: `File not found: ${path}` } as any;
    } catch (err) {
        return { error: `Failed to fetch import: ${path}` } as any;
    }
}

interface CompilationError {
    severity: "error" | "warning" | "info";
    message: string;
    formattedMessage: string;
    sourceLocation?: {
        start: number;
        end: number;
    };
}

interface CompilationResult {
    success: boolean;
    errors: CompilationError[];
    warnings: CompilationError[];
    abi?: any[];
    bytecode?: string;
    contractName?: string;
}

export async function compileContract(req: AuthRequest, res: Response) {
    try {
        const { sourceCode } = req.body;

        if (!sourceCode || typeof sourceCode !== "string") {
            return res.status(400).json({
                success: false,
                error: "sourceCode is required and must be a string",
            });
        }

        log.info("Compiling Solidity contract...");

        let result;
        try {
            result = compileSolidity(sourceCode);
        } catch (e: any) {
            // solc throws string messages
            log.error(`Compilation failed ${e}`);

            return res.status(400).json({
                success: false,
                error: e.message || "Failed to compile",
                errors: [
                    {
                        severity: "error",
                        message: e.message,
                        formattedMessage: e.message,
                    },
                ],
                warnings: [],
            });
        }

        const response: CompilationResult = {
            success: true,
            abi: result.abi,
            bytecode: result.bytecode,
            contractName: result.contractName,
            errors: [],
            warnings: result.warnings.map((w: any) => ({
                severity: "warning",
                message: w.message || "",
                formattedMessage: w.formattedMessage || w.message,
                sourceLocation: w.sourceLocation,
            })),
        };

        log.info("Compilation successful");

        return res.json(response);
    } catch (error: any) {
        log.error(`Server crash while compiling ${error}`);

        return res.status(500).json({
            success: false,
            error: "Internal server error",
            errors: [
                {
                    severity: "error",
                    message: error.message,
                    formattedMessage: error.stack,
                },
            ],
            warnings: [],
        });
    }
}
