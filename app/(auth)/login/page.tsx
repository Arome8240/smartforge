"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { useLogin } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { ready, authenticated, login: privyLogin } = usePrivy();
  const router = useRouter();
  const loginMutation = useLogin();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (ready && authenticated) {
      // After Privy authentication, call backend login
      handleBackendLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated]);

  const handleBackendLogin = async () => {
    if (!authenticated) return;

    try {
      setIsLoggingIn(true);
      await loginMutation.mutateAsync();
      toast({
        title: "Welcome!",
        description: "Successfully logged in.",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.response?.data?.error || "Failed to complete login",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async () => {
    try {
      await privyLogin();
    } catch (error) {
      console.error("Privy login failed:", error);
    }
  };

  if (ready && authenticated && !isLoggingIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none opacity-5">
        {[...Array(64)].map((_, i) => (
          <div key={i} className="border border-primary" />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold text-foreground mb-2">
            SmartForge
          </h1>
          <p className="text-muted-foreground">Web3 Contract Builder</p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-foreground">
              Welcome to SmartForge
            </CardTitle>
            <CardDescription>
              Sign in with your wallet to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogin}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold flex items-center justify-center gap-2 h-12"
              size="lg"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By connecting, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
