import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { log } from "../utils/logger";
import solc from "solc";

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
        error: "sourceCode is required and must be a string",
      });
    }

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
            "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
          },
        },
      },
    };

    log.info("Compiling Solidity contract...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    const result: CompilationResult = {
      success: true,
      errors: [],
      warnings: [],
    };

    // Process compilation errors and warnings
    if (output.errors && output.errors.length > 0) {
      for (const error of output.errors) {
        const compilationError: CompilationError = {
          severity: error.severity as "error" | "warning" | "info",
          message: error.message || "",
          formattedMessage: error.formattedMessage || error.message || "",
          sourceLocation: error.sourceLocation,
        };

        if (error.severity === "error") {
          result.errors.push(compilationError);
          result.success = false;
        } else if (error.severity === "warning") {
          result.warnings.push(compilationError);
        }
      }
    }

    // If compilation succeeded, extract contract info
    if (result.success && output.contracts?.Contract) {
      const contracts = output.contracts.Contract;
      const [contractName, contractData] = Object.entries<any>(contracts)[0];
      
      if (contractData) {
        result.abi = contractData.abi;
        result.bytecode = contractData.evm?.bytecode?.object
          ? "0x" + contractData.evm.bytecode.object
          : undefined;
        result.contractName = contractName;
      }
    }

    log.info(
      `Compilation ${result.success ? "successful" : "failed"} with ${
        result.errors.length
      } errors and ${result.warnings.length} warnings`
    );

    res.json(result);
  } catch (error: any) {
    log.error(`Compilation error: ${error.message || error}`);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to compile contract",
      errors: [
        {
          severity: "error",
          message: error.message || "Unknown compilation error",
          formattedMessage: error.message || "Unknown compilation error",
        },
      ],
      warnings: [],
    });
  }
}
