import { Request, Response } from "express";
import { User } from "../models/User";
import { log } from "../utils/logger";
import { privyClient } from "../lib/privy";

export async function login(req: Request, res: Response) {
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
        const privyUser = await privyClient.users()._get(claims.user_id);

        if (!privyUser) {
            return res.status(404).json({ error: "User does not exist in Privy" });
        }

        // 3. Find linked wallet
        const walletAccount = privyUser.linked_accounts?.find((acc: any) => acc.address || acc.type === "wallet");

        const walletAddress = (walletAccount as any)?.address;

        if (!walletAddress) {
            return res.status(401).json({ error: "No wallet address linked to Privy user" });
        }

        // 4. Check if user exists in database, create if not
        let user = await User.findOne({
            $or: [{ walletAddress }, { privyUserId: claims.user_id }],
        });

        if (!user) {
            // Create new user
            user = await User.create({
                walletAddress,
                privyUserId: claims.user_id,
                plan: "free",
            });
            log.info(`Created new user with wallet: ${walletAddress}`);
        } else {
            // Update missing fields if necessary
            let updated = false;

            if (!user.walletAddress && walletAddress) {
                user.walletAddress = walletAddress;
                updated = true;
            }

            if (user.privyUserId !== claims.user_id) {
                user.privyUserId = claims.user_id;
                updated = true;
            }

            if (updated) {
                await user.save();
            }
        }

        // 5. Return user info
        res.json({
            user: {
                id: user._id,
                walletAddress: user.walletAddress,
                privyUserId: user.privyUserId,
                plan: user.plan,
            },
        });
    } catch (error: any) {
        log.error(`Login error: ${error.message || error}`);
        res.status(500).json({ error: "Login failed" });
    }
}
