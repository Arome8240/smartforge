"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
            config={{
                loginMethods: ["wallet", "email", "sms"],
                appearance: {
                    theme: "dark",
                    accentColor: "#00ff88",
                    logo: "/logo.svg",
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
