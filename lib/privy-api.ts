import { usePrivy } from "@privy-io/react-auth";
import axios, { AxiosInstance } from "axios";
import { toast } from "sonner";

export function createPrivyApiClient(getAccessToken: () => Promise<string | null>): AxiosInstance {
    const client = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Add Privy access token to requests
    client.interceptors.request.use(async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Handle errors
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Handle unauthorized - Privy will handle re-authentication
                if (typeof window !== "undefined") {
                    toast.error(error.response.data.error || "Unauthorized. Please log in again.");

                    window.location.href = "/login";
                }
            }
            return Promise.reject(error);
        }
    );

    return client;
}

// Hook to get API client with Privy token
export function usePrivyApiClient() {
    const { getAccessToken } = usePrivy();

    return createPrivyApiClient(getAccessToken);
}
