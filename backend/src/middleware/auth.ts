import { Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/node";

const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID || "",
  process.env.PRIVY_APP_SECRET || ""
);

export interface AuthRequest extends Request {
  user?: {
    walletAddress: string;
    privyUserId: string;
  };
}

export async function authenticatePrivy(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);
    const claims = await privyClient.verifyAuthToken(token);

    if (!claims.userId || !claims.wallet?.address) {
      return res.status(401).json({ error: "Invalid token claims" });
    }

    req.user = {
      walletAddress: claims.wallet.address,
      privyUserId: claims.userId,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
