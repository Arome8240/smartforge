"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useWallets } from "@privy-io/react-auth";
import { usePrivyApiClient } from "@/lib/privy-api";
import { deployContractClientSide } from "@/lib/client-deploy";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Rocket, Loader2 } from "lucide-react";

// Base networks only
const PRESET_NETWORKS = [
    { name: "Base Sepolia", chainId: 84532, rpcUrl: "https://sepolia.base.org" },
    { name: "Base Mainnet", chainId: 8453, rpcUrl: "https://mainnet.base.org" },
];

const deploymentSchema = z.object({
    networkPreset: z.string(),
    networkName: z.string().min(1, "Network name is required"),
    chainId: z.coerce.number().min(1, "Chain ID must be a positive number"),
    rpcUrl: z.string().url("Must be a valid URL"),
});

type DeploymentFormData = z.infer<typeof deploymentSchema>;

interface DeployDialogProps {
    projectId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function DeployDialog({ projectId, onSuccess, trigger }: DeployDialogProps) {
    const [open, setOpen] = useState(false);
    const [isCustomNetwork, setIsCustomNetwork] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const { wallets } = useWallets();
    const apiClient = usePrivyApiClient();

    const form = useForm<DeploymentFormData>({
        resolver: zodResolver(deploymentSchema),
        defaultValues: {
            networkPreset: "Base Sepolia",
            networkName: "Base Sepolia",
            chainId: 84532,
            rpcUrl: "https://sepolia.base.org",
        },
    });

    const handleNetworkChange = (value: string) => {
        const preset = PRESET_NETWORKS.find((n) => n.name === value);
        if (preset) {
            form.setValue("networkName", preset.name);
            form.setValue("chainId", preset.chainId);
            form.setValue("rpcUrl", preset.rpcUrl);
        }
    };

    const onSubmit = async (data: DeploymentFormData) => {
        setIsDeploying(true);
        try {
            // Get the user's embedded wallet
            const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
            if (!embeddedWallet) {
                toast.error("Wallet not found", {
                    description: "Please ensure your Privy wallet is connected.",
                });
                return;
            }

            // Get the EIP-1193 provider from the wallet
            const provider = await embeddedWallet.getEthereumProvider();

            // Switch to the correct network if needed
            try {
                await embeddedWallet.switchChain(data.chainId);
                toast.info("Switched network", {
                    description: `Connected to ${data.networkName}`,
                });
            } catch (switchError: any) {
                console.error("Network switch error:", switchError);
                // If network doesn't exist, try to add it
                if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain")) {
                    toast.error("Network not available", {
                        description: `Unable to switch to ${data.networkName}. Please add this network to your wallet first.`,
                    });
                    return;
                }
                throw switchError;
            }

            // Step 1: Get compiled contract from backend
            toast.info("Compiling contract...");
            const compileResponse = await apiClient.get(`/projects/${projectId}/compile`);
            const { abi, bytecode, contractName } = compileResponse.data;

            // Step 2: Deploy using client's wallet
            toast.info("Deploying contract...", {
                description: "Please confirm the transaction in your wallet.",
            });
            
            const { address, txHash } = await deployContractClientSide({
                bytecode,
                abi,
                chainId: data.chainId,
                rpcUrl: data.rpcUrl,
                provider,
            });

            // Step 3: Record deployment on backend
            await apiClient.post(`/projects/${projectId}/record-deployment`, {
                address,
                txHash,
                networkConfig: {
                    name: data.networkName,
                    chainId: data.chainId,
                    rpcUrl: data.rpcUrl,
                },
            });

            toast.success("Contract deployed!", {
                description: `Deployed to ${address} on ${data.networkName}`,
            });

            setOpen(false);
            form.reset();
            onSuccess?.();
        } catch (error: any) {
            console.error("Deployment failed:", error);
            toast.error("Deployment failed", {
                description: error?.message || "Failed to deploy contract. Please try again.",
            });
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <Rocket className="w-4 h-4" />
                        Deploy Contract
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Deploy to Base Network</DialogTitle>
                    <DialogDescription>
                        Deploy your contract to Base Mainnet or Base Sepolia testnet. The contract will be deployed
                        from your Privy wallet—no private key sharing needed.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Network Preset Selector */}
                        <FormField
                            control={form.control}
                            name="networkPreset"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Network</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            handleNetworkChange(value);
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a network" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {PRESET_NETWORKS.map((network) => (
                                                <SelectItem key={network.name} value={network.name}>
                                                    {network.name} (Chain ID: {network.chainId})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Choose Base Mainnet for production or Base Sepolia for testing
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isDeploying}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isDeploying}>
                                {isDeploying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deploying...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4 mr-2" />
                                        Deploy
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
