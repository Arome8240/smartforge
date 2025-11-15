"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles, Zap } from "lucide-react";

export default function PricingPage() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  const plans = [
    {
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
      cta: "Current Plan",
      disabled: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "month",
      description: "For professional developers",
      features: [
        "Unlimited projects",
        "Advanced templates",
        "Faster deployments",
        "Priority support",
        "Gasless transactions",
        "Collaborative editing (coming soon)",
        "Version history",
      ],
      cta: "Upgrade to Pro",
      disabled: false,
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Pricing Plans
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your development needs
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-primary/20 bg-card/50 relative ${
                plan.popular ? "border-primary/40 ring-2 ring-primary/20" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {plan.name === "Pro" ? (
                    <Sparkles className="w-6 h-6 text-primary" />
                  ) : (
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  )}
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
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  disabled={plan.disabled}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

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
                We accept all major credit cards and cryptocurrency payments via
                wallet.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Is there a free trial for Pro?
              </h3>
              <p className="text-muted-foreground">
                Yes, we offer a 14-day free trial for the Pro plan. No credit
                card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
