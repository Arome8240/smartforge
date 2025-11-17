import { encodeFunctionData, parseUnits } from "viem";

// USDC contract address on Base Sepolia testnet
// Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
export const USDC_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_USDC_TESTNET_ADDRESS ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`;

// Base Sepolia chain ID
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// USDC ABI (minimal - just what we need for transfers)
const USDC_ABI = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * Create a USDC transfer transaction data
 * Returns transaction request compatible with Privy's sendTransaction
 */
export function createUSDCTransfer(
  recipient: string,
  amount: string // Amount in USDC (e.g., "19.00")
): {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
} {
  // USDC has 6 decimals
  const amountInSmallestUnit = parseUnits(amount, 6);

  // Encode the transfer function call
  const data = encodeFunctionData({
    abi: USDC_ABI,
    functionName: "transfer",
    args: [recipient as `0x${string}`, amountInSmallestUnit],
  });

  return {
    to: USDC_CONTRACT_ADDRESS,
    data,
    value: BigInt(0), // ERC20 transfers don't send ETH
  };
}
