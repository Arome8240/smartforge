import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/providers/providers";
import "./globals.css";

const rogan = localFont({
    src: [
        {
            path: "./fonts/Rogan-Regular.otf",
            weight: "400",
            style: "normal",
        },
        {
            path: "./fonts/Rogan-Medium.otf",
            weight: "500",
            style: "normal",
        },
        {
            path: "./fonts/Rogan-SemiBold.otf",
            weight: "600",
            style: "normal",
        },
    ],
    variable: "--font-rogan",
});

export const metadata: Metadata = {
    title: "SmartForge - Web3 Contract Builder",
    description: "Visual smart contract generator for Web3 developers",
    generator: "v0.app",
    icons: {
        icon: [
            {
                url: "/icon-light-32x32.png",
                media: "(prefers-color-scheme: light)",
            },
            {
                url: "/icon-dark-32x32.png",
                media: "(prefers-color-scheme: dark)",
            },
            {
                url: "/icon.svg",
                type: "image/svg+xml",
            },
        ],
        apple: "/apple-icon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <body className={`${rogan.variable} font-sans antialiased`}>
                <Providers>
                    {children}
                    <Analytics />
                </Providers>
            </body>
        </html>
    );
}
