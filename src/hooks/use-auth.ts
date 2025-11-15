import { useMutation } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { createPrivyApiClient } from "@/lib/privy-api";

interface LoginResponse {
  user: {
    id: string;
    walletAddress: string;
    privyUserId: string;
    plan: "free" | "pro";
  };
}

export function useLogin() {
  const { getAccessToken } = usePrivy();
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  );

  return useMutation({
    mutationFn: async (): Promise<LoginResponse> => {
      const { data } = await apiClient.post<LoginResponse>("/auth/login");
      return data;
    },
  });
}

export function useLogout() {
  const { logout } = usePrivy();

  return async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };
}
