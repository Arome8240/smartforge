import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { createPrivyApiClient } from "@/lib/privy-api";

export interface Subscription {
  plan: "free" | "standard" | "premium";
  subscription: {
    id: string;
    plan: "free" | "standard" | "premium";
    status: "active" | "cancelled" | "expired" | "pending_payment";
    startDate: string;
    endDate?: string;
    autoRenew: boolean;
  } | null;
}

export interface PaymentIntent {
  subscriptionId: string;
  amount: string;
  currency: string;
  network: string;
  recipientAddress: string;
}

export function useSubscription() {
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await apiClient.get<Subscription>("/subscriptions");
      return data;
    },
  });
}

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async (plan: "standard" | "premium") => {
      const { data } = await apiClient.post<PaymentIntent>(
        "/subscriptions/payment-intent",
        { plan }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async ({
      subscriptionId,
      txHash,
    }: {
      subscriptionId: string;
      txHash: string;
    }) => {
      const { data } = await apiClient.post<{
        confirmed: boolean;
        amount: string;
        subscription: any;
      }>("/subscriptions/verify-payment", { subscriptionId, txHash });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string }>(
        "/subscriptions/cancel"
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
