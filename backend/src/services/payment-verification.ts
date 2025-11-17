import { JsonRpcProvider, Contract } from "ethers";
import { log } from "../utils/logger";

// Base Sepolia RPC
const BASE_SEPOLIA_RPC_URL =
  process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

// USDC contract address on Base Sepolia testnet
const USDC_CONTRACT_ADDRESS =
  process.env.USDC_TESTNET_ADDRESS ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// USDC ABI (minimal - just what we need for transfer verification)
const USDC_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

// Payment recipient address (your platform's wallet)
const PAYMENT_RECIPIENT =
  process.env.PAYMENT_RECIPIENT_ADDRESS ||
  "0x0000000000000000000000000000000000000000"; // Replace with your actual payment wallet

interface PaymentVerification {
  confirmed: boolean;
  amount: string;
  from: string;
  to: string;
  blockNumber?: number;
}

/**
 * Verify a USDC transfer transaction on Base Sepolia
 */
export async function verifyPaymentTransaction(
  txHash: string,
  expectedAmount: string,
  expectedFrom: string
): Promise<PaymentVerification> {
  try {
    const provider = new JsonRpcProvider(BASE_SEPOLIA_RPC_URL);

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      log.warn(`Transaction ${txHash} not found`);
      return {
        confirmed: false,
        amount: "0",
        from: expectedFrom,
        to: PAYMENT_RECIPIENT,
      };
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      log.warn(`Transaction ${txHash} failed`);
      return {
        confirmed: false,
        amount: "0",
        from: expectedFrom,
        to: PAYMENT_RECIPIENT,
      };
    }

    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return {
        confirmed: false,
        amount: "0",
        from: expectedFrom,
        to: PAYMENT_RECIPIENT,
      };
    }

    // Verify it's a USDC transfer
    if (tx.to?.toLowerCase() !== USDC_CONTRACT_ADDRESS.toLowerCase()) {
      log.warn(
        `Transaction ${txHash} is not to USDC contract. Expected ${USDC_CONTRACT_ADDRESS}, got ${tx.to}`
      );
      return {
        confirmed: false,
        amount: "0",
        from: expectedFrom,
        to: PAYMENT_RECIPIENT,
      };
    }

    // Parse Transfer events from receipt
    const usdcContract = new Contract(
      USDC_CONTRACT_ADDRESS,
      USDC_ABI,
      provider
    );
    const decimals = await usdcContract.decimals();

    // Find Transfer event in logs
    const transferEvent = receipt.logs.find((log) => {
      try {
        const parsed = usdcContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "Transfer";
      } catch {
        return false;
      }
    });

    if (!transferEvent) {
      log.warn(`No Transfer event found in transaction ${txHash}`);
      return {
        confirmed: false,
        amount: "0",
        from: expectedFrom,
        to: PAYMENT_RECIPIENT,
      };
    }

    // Parse the Transfer event
    const parsed = usdcContract.interface.parseLog({
      topics: transferEvent.topics as string[],
      data: transferEvent.data,
    });

    if (!parsed || parsed.name !== "Transfer") {
      return {
        confirmed: false,
        amount: "0",
        from: expectedFrom,
        to: PAYMENT_RECIPIENT,
      };
    }

    const from = parsed.args[0] as string;
    const to = parsed.args[1] as string;
    const value = parsed.args[2] as bigint;

    // Convert to USDC amount (6 decimals)
    const amount = (Number(value) / 10 ** decimals).toFixed(6);

    // Verify payment details
    const expectedAmountInSmallestUnit = BigInt(
      Math.floor(parseFloat(expectedAmount) * 10 ** decimals)
    );

    const isCorrectAmount = value >= expectedAmountInSmallestUnit;
    const isCorrectFrom = from.toLowerCase() === expectedFrom.toLowerCase();
    const isCorrectTo = to.toLowerCase() === PAYMENT_RECIPIENT.toLowerCase();

    if (isCorrectAmount && isCorrectFrom && isCorrectTo) {
      log.success(
        `Payment verified: ${amount} USDC from ${from} to ${to} (tx: ${txHash})`
      );
      return {
        confirmed: true,
        amount,
        from,
        to,
        blockNumber: receipt.blockNumber,
      };
    } else {
      log.warn(
        `Payment verification failed for ${txHash}: amount=${isCorrectAmount}, from=${isCorrectFrom}, to=${isCorrectTo}`
      );
      return {
        confirmed: false,
        amount,
        from,
        to,
        blockNumber: receipt.blockNumber,
      };
    }
  } catch (error: any) {
    log.error(`Payment verification error: ${error.message || error}`);
    return {
      confirmed: false,
      amount: "0",
      from: expectedFrom,
      to: PAYMENT_RECIPIENT,
    };
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
