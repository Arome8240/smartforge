import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { log } from "../utils/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

export async function generateCode(req: AuthRequest, res: Response) {
  try {
    const { prompt, currentCode } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "prompt is required and must be a string",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured",
      });
    }

    log.info(`Generating Solidity code with Gemini for prompt: ${prompt.substring(0, 100)}...`);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are an expert Solidity smart contract developer. Your task is to generate clean, secure, and well-documented Solidity code based on user requirements.

Guidelines:
- Always use Solidity best practices and security patterns
- Include clear comments explaining the code
- Use appropriate Solidity version pragma
- Follow naming conventions (PascalCase for contracts, camelCase for functions)
- Include necessary imports (e.g., OpenZeppelin if needed)
- Add events for important state changes
- Include access control when appropriate
- Consider gas optimization
- Add NatSpec documentation for public functions

${currentCode ? `Current code context:\n\`\`\`solidity\n${currentCode}\n\`\`\`\n\nModify or extend this code based on the user's request.` : 'Generate new Solidity code based on the user\'s request.'}

User request: ${prompt}

Respond ONLY with valid Solidity code. Do not include explanations outside code comments.`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    let generatedCode = response.text();

    // Clean up the response - remove markdown code blocks if present
    generatedCode = generatedCode
      .replace(/```solidity\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    log.info("Code generation successful");

    res.json({
      success: true,
      code: generatedCode,
    });
  } catch (error: any) {
    log.error(`AI code generation error: ${error.message || error}`);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate code",
    });
  }
}

export async function improveCode(req: AuthRequest, res: Response) {
  try {
    const { code, instruction } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "code is required and must be a string",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured",
      });
    }

    log.info(`Improving Solidity code with instruction: ${instruction || "general improvement"}`);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are an expert Solidity smart contract auditor and developer. Your task is to improve the following Solidity code.

${instruction ? `Specific instruction: ${instruction}` : 'Improve the code for: security, gas optimization, readability, and best practices.'}

Current code:
\`\`\`solidity
${code}
\`\`\`

Provide the improved version with:
- Security enhancements
- Gas optimizations where applicable
- Better code structure and readability
- Comprehensive comments
- Fixed vulnerabilities or issues

Respond ONLY with the improved Solidity code. Do not include explanations outside code comments.`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    let improvedCode = response.text();

    // Clean up the response
    improvedCode = improvedCode
      .replace(/```solidity\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    log.info("Code improvement successful");

    res.json({
      success: true,
      code: improvedCode,
    });
  } catch (error: any) {
    log.error(`AI code improvement error: ${error.message || error}`);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to improve code",
    });
  }
}
