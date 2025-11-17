import { log } from "../utils/logger";

// Circle API configuration
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || "";
const CIRCLE_API_URL =
  process.env.CIRCLE_API_URL || "https://api-sandbox.circle.com";
const USDC_CONTRACT_ADDRESS =
  process.env.USDC_TESTNET_ADDRESS ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC testnet

interface CirclePaymentRequest {
  amount: {
    amount: string;
    currency: "USDC";
  };
  source: {
    type: "wallet";
    id: string; // User's wallet address
  };
  idempotencyKey: string;
  description?: string;
}

interface CirclePaymentResponse {
  data?: {
    id: string;
    status: string;
    amount: {
      amount: string;
      currency: string;
    };
    source: {
      type: string;
      id: string;
    };
    description?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Create a payment intent with Circle
 * Note: This is a simplified implementation. In production, you'd use Circle's full SDK
 */
export async function createCirclePayment(
  amount: string,
  walletAddress: string,
  description: string,
  idempotencyKey: string
): Promise<{ paymentId: string; status: string }> {
  if (!CIRCLE_API_KEY) {
    log.warn("Circle API key not configured, using mock payment");
    // Return mock payment for development
    return {
      paymentId: `mock_${Date.now()}`,
      status: "pending",
    };
  }

  try {
    // Convert amount to smallest unit (USDC has 6 decimals)
    const amountInSmallestUnit = Math.floor(
      parseFloat(amount) * 1000000
    ).toString();

    const requestBody: CirclePaymentRequest = {
      amount: {
        amount: amountInSmallestUnit,
        currency: "USDC",
      },
      source: {
        type: "wallet",
        id: walletAddress,
      },
      idempotencyKey,
      description,
    };

    const response = await fetch(`${CIRCLE_API_URL}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as CirclePaymentResponse;

    if (data.error) {
      throw new Error(`Circle API error: ${data.error.message}`);
    }

    if (!data.data) {
      throw new Error("No payment data returned from Circle");
    }

    return {
      paymentId: data.data.id,
      status: data.data.status,
    };
  } catch (error: any) {
    log.error(`Circle payment creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Verify a payment with Circle
 */
export async function verifyCirclePayment(
  paymentId: string
): Promise<{ status: string; confirmed: boolean }> {
  if (!CIRCLE_API_KEY || paymentId.startsWith("mock_")) {
    // Mock payment verification
    return {
      status: "paid",
      confirmed: true,
    };
  }

  try {
    const response = await fetch(`${CIRCLE_API_URL}/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
      },
    });

    const data = (await response.json()) as CirclePaymentResponse;

    if (data.error) {
      throw new Error(`Circle API error: ${data.error.message}`);
    }

    if (!data.data) {
      throw new Error("No payment data returned from Circle");
    }

    return {
      status: data.data.status,
      confirmed:
        data.data.status === "paid" || data.data.status === "confirmed",
    };
  } catch (error: any) {
    log.error(`Circle payment verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get payment plan pricing in USDC
 */
export function getPlanPrice(plan: "standard" | "premium"): string {
  const prices = {
    standard: "19.00", // $19/month in USDC
    premium: "49.00", // $49/month in USDC
  };
  return prices[plan];
}
