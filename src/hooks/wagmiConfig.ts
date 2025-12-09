// src/wagmiConfig.ts
import { createConfig } from "@privy-io/wagmi";
import { mainnet, sepolia, base, arbitrum, optimism, baseSepolia } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = createConfig({
    chains: [base, baseSepolia],
    transports: {
        [base.id]: http("https://mainnet.base.org"),
        [baseSepolia.id]: http("https://sepolia.base.org"), // Explicitly define Base Sepolia RPC URL
    },
});
