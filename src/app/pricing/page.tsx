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
import { Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useSubscription,
  useCreatePaymentIntent,
  useVerifyPayment,
} from "@/hooks/use-subscriptions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createUSDCTransfer, BASE_SEPOLIA_CHAIN_ID } from "@/lib/usdc-payment";

export default function PricingPage() {
  const { ready, authenticated, user, sendTransaction } = usePrivy();
  const router = useRouter();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const createPaymentIntent = useCreatePaymentIntent();
  const verifyPayment = useVerifyPayment();

  const [selectedPlan, setSelectedPlan] = useState<
    "standard" | "premium" | null
  >(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [sendingTx, setSendingTx] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "1 project max",
        "Basic templates (ERC20, ERC721, Custom)",
        "Community support",
        "Standard deployments",
      ],
      cta: subscription?.plan === "free" ? "Current Plan" : "Downgrade",
      disabled: false,
      icon: Zap,
    },
    {
      id: "standard",
      name: "Standard",
      price: "$19",
      period: "month",
      description: "For growing developers",
      features: [
        "10 projects max",
        "All templates",
        "Priority support",
        "Gasless transactions",
        "Faster deployments",
        "Email support",
      ],
      cta:
        subscription?.plan === "standard"
          ? "Current Plan"
          : "Upgrade to Standard",
      disabled: false,
      popular: true,
      icon: Sparkles,
    },
    {
      id: "premium",
      name: "Premium",
      price: "$49",
      period: "month",
      description: "For professional teams",
      features: [
        "Unlimited projects",
        "All templates",
        "24/7 priority support",
        "Gasless transactions",
        "Fastest deployments",
        "Advanced analytics",
        "Version history",
        "Collaborative editing (coming soon)",
      ],
      cta:
        subscription?.plan === "premium"
          ? "Current Plan"
          : "Upgrade to Premium",
      disabled: false,
      icon: Crown,
    },
  ];

  const handleUpgrade = async (planId: "standard" | "premium") => {
    if (subscription?.plan === planId) {
      toast.info("You're already on this plan");
      return;
    }

    try {
      setSelectedPlan(planId);
      const intent = await createPaymentIntent.mutateAsync(planId);
      setPaymentIntent(intent);
      setPaymentDialogOpen(true);
    } catch (error: any) {
      toast.error("Failed to create payment", {
        description: error.response?.data?.error || "Please try again",
      });
    }
  };

  const handleSendPayment = async () => {
    if (!paymentIntent || !user?.wallet?.address || !sendTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    setSendingTx(true);
    try {
      // Create USDC transfer transaction for Base Sepolia
      const txRequest = createUSDCTransfer(
        paymentIntent.recipientAddress,
        paymentIntent.amount
      );

      // Ensure transaction is sent on Base Sepolia
      const txWithChain = {
        ...txRequest,
        chainId: BASE_SEPOLIA_CHAIN_ID,
      };

      // Send transaction via Privy on Base Sepolia
      // Privy's sendTransaction returns { hash: string }
      const result = await sendTransaction(txWithChain);
      const hash = typeof result === "string" ? result : result.hash;

      setTxHash(hash);
      toast.success("Transaction sent!", {
        description: `Transaction hash: ${hash.slice(0, 10)}...`,
      });

      // Wait a bit for transaction to be mined, then verify
      // In production, you might want to poll or use a webhook
      setTimeout(async () => {
        try {
          // Verify payment with backend
          const verifyResult = await verifyPayment.mutateAsync({
            subscriptionId: paymentIntent.subscriptionId,
            txHash: hash,
          });

          if (verifyResult.confirmed) {
            toast.success("Payment confirmed!", {
              description: `You've successfully upgraded to ${selectedPlan} plan.`,
            });
            setPaymentDialogOpen(false);
            setPaymentIntent(null);
            setSelectedPlan(null);
            setTxHash(null);
          } else {
            toast.error("Payment verification failed", {
              description: "Please contact support if this issue persists.",
            });
          }
        } catch (error: any) {
          console.error("Verification error:", error);
          toast.error("Payment verification failed", {
            description: error.response?.data?.error || "Please try again",
          });
        }
      }, 5000); // Wait 5 seconds for transaction to be mined
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Payment failed", {
        description:
          error.message || error.response?.data?.error || "Please try again",
      });
      setSendingTx(false);
    }
  };

  if (!ready || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Pricing Plans
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your development needs. Pay with USDC on
            Base Sepolia testnet.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`border-primary/20 bg-card/50 relative ${
                  plan.popular ? "border-primary/40 ring-2 ring-primary/20" : ""
                } ${isCurrentPlan ? "ring-2 ring-green-500/50" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-6 h-6 text-primary" />
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period !== "forever" && (
                      <span className="text-muted-foreground">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : isCurrentPlan
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                    disabled={
                      plan.disabled ||
                      isCurrentPlan ||
                      (plan.id === "free" && subscription?.plan !== "free")
                    }
                    onClick={() => {
                      if (plan.id === "free") {
                        // Handle downgrade
                        toast.info("Contact support to downgrade");
                      } else {
                        handleUpgrade(plan.id as "standard" | "premium");
                      }
                    }}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                Pay {paymentIntent?.amount} USDC to upgrade to {selectedPlan}{" "}
                plan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Payment Details:
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-semibold capitalize">
                      {selectedPlan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      {paymentIntent?.amount} {paymentIntent?.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span className="font-mono text-xs">Base Sepolia</span>
                  </div>
                  {txHash && (
                    <div className="flex justify-between">
                      <span>Transaction:</span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {txHash.slice(0, 10)}...
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the button below to send the USDC payment from your
                wallet. The transaction will be verified automatically.
              </p>
              <Button
                onClick={handleSendPayment}
                disabled={sendingTx || verifyPayment.isPending || !!txHash}
                className="w-full"
              >
                {sendingTx || verifyPayment.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {txHash ? "Verifying Payment..." : "Sending Transaction..."}
                  </>
                ) : txHash ? (
                  "Payment Verified"
                ) : (
                  "Send Payment"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept USDC payments on Base Sepolia testnet. Payments are
                processed directly from your wallet.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                How do I get USDC on testnet?
              </h3>
              <p className="text-muted-foreground">
                You can get testnet USDC from Base Sepolia faucets or use Circle
                testnet wallets for testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
