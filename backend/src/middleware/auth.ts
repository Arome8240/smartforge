import { Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/node";
import { log } from "../utils/logger";

const privyClient = new PrivyClient({
  appId: "cmhzwck4300lajy0cbtmlmtxl",
  appSecret:
    "2ATNrd31uiWskM1rsdsu3SJgkppUG4efVEiinBye8sJPGbWafSeXvHHFabdrxBmkmpWerfBaPx3hASk2k9php2mc",
});

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

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 1. Verify token → returns claims
    const claims = await privyClient.utils().auth().verifyAuthToken(token);

    if (!claims?.user_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 2. Fetch full Privy user using claims.user_id
    const user = await privyClient.users()._get(claims.user_id);

    log.success(`Privy user ${claims.user_id} authenticated`);

    if (!user) {
      return res.status(404).json({ error: "User does not exist in Privy" });
    }

    // 3. Find linked wallet
    const walletAccount = user.linked_accounts?.find(
      (acc: any) =>
        acc.type === "wallet" ||
        acc.wallet_client_type ||
        acc.address ||
        acc.wallet_client
    );

    console.log(
      "Wallet Account:",
      walletAccount,
      (user as any)?.linked_accounts[1].address
    );

    const walletAddress = (user as any)?.linked_accounts[1].address;

    if (!walletAddress) {
      log.warn(`User ${claims.user_id} has no wallet linked`);
      return res
        .status(401)
        .json({ error: "No wallet address linked to Privy user" });
    }

    // 4. Attach user to request object
    req.user = {
      walletAddress,
      privyUserId: claims.user_id,
    };

    next();
  } catch (error: any) {
    log.error(`Privy authentication failed: ${error.message || error}`);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
