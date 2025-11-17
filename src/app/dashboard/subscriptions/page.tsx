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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSubscription,
  useCancelSubscription,
} from "@/hooks/use-subscriptions";
import { toast } from "sonner";
import { Calendar, CreditCard, X, Check } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SubscriptionsPage() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { data: subscription, isLoading } = useSubscription();
  const cancelSubscription = useCancelSubscription();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  const handleCancel = async () => {
    try {
      await cancelSubscription.mutateAsync();
      toast.success("Subscription cancelled", {
        description: "Your subscription has been cancelled successfully.",
      });
    } catch (error: any) {
      toast.error("Failed to cancel subscription", {
        description: error.response?.data?.error || "Please try again",
      });
    }
  };

  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const planDetails = {
    free: {
      name: "Free",
      projects: "1 project",
      price: "$0",
    },
    standard: {
      name: "Standard",
      projects: "10 projects",
      price: "$19/month",
    },
    premium: {
      name: "Premium",
      projects: "Unlimited projects",
      price: "$49/month",
    },
  };

  const currentPlan = planDetails[subscription?.plan || "free"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Plan Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription className="mt-1">
                    Your active subscription plan
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    subscription?.plan === "free" ? "outline" : "default"
                  }
                  className="text-lg px-4 py-1"
                >
                  {currentPlan.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-2xl font-bold text-foreground">
                    {currentPlan.price}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Project Limit
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {currentPlan.projects}
                  </p>
                </div>
              </div>

              {subscription?.subscription && (
                <div className="pt-4 border-t border-border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant={
                          subscription.subscription.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {subscription.subscription.status}
                      </Badge>
                    </div>
                    {subscription.subscription.startDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Start Date
                        </span>
                        <span className="font-mono">
                          {new Date(
                            subscription.subscription.startDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {subscription.subscription.endDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="font-mono">
                          {new Date(
                            subscription.subscription.endDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Auto Renew</span>
                      {subscription.subscription.autoRenew ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/pricing">Change Plan</Link>
            </Button>
            {subscription?.plan !== "free" &&
              subscription?.subscription?.status === "active" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <X className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your subscription? You
                        will be downgraded to the Free plan immediately. You can
                        upgrade again at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Subscription
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
