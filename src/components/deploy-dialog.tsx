"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

// Common EVM networks
const PRESET_NETWORKS = [
    { name: "Ethereum Mainnet", chainId: 1, rpcUrl: "https://eth.llamarpc.com" },
    { name: "Ethereum Sepolia", chainId: 11155111, rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com" },
    { name: "Polygon Mainnet", chainId: 137, rpcUrl: "https://polygon-rpc.com" },
    { name: "Polygon Amoy", chainId: 80002, rpcUrl: "https://rpc-amoy.polygon.technology" },
    { name: "BSC Mainnet", chainId: 56, rpcUrl: "https://bsc-dataseed.binance.org" },
    { name: "BSC Testnet", chainId: 97, rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545" },
    { name: "Arbitrum One", chainId: 42161, rpcUrl: "https://arb1.arbitrum.io/rpc" },
    { name: "Arbitrum Sepolia", chainId: 421614, rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc" },
    { name: "Optimism Mainnet", chainId: 10, rpcUrl: "https://mainnet.optimism.io" },
    { name: "Optimism Sepolia", chainId: 11155420, rpcUrl: "https://sepolia.optimism.io" },
    { name: "Base Mainnet", chainId: 8453, rpcUrl: "https://mainnet.base.org" },
    { name: "Base Sepolia", chainId: 84532, rpcUrl: "https://sepolia.base.org" },
    { name: "Avalanche C-Chain", chainId: 43114, rpcUrl: "https://api.avax.network/ext/bc/C/rpc" },
    { name: "Avalanche Fuji", chainId: 43113, rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc" },
    { name: "Custom", chainId: 0, rpcUrl: "" },
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
    onDeploy: (data: { networkConfig: { name: string; chainId: number; rpcUrl: string } }) => Promise<void>;
    isDeploying?: boolean;
    trigger?: React.ReactNode;
}

export function DeployDialog({ projectId, onDeploy, isDeploying = false, trigger }: DeployDialogProps) {
    const [open, setOpen] = useState(false);
    const [isCustomNetwork, setIsCustomNetwork] = useState(false);

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
            setIsCustomNetwork(value === "Custom");
            if (value !== "Custom") {
                form.setValue("networkName", preset.name);
                form.setValue("chainId", preset.chainId);
                form.setValue("rpcUrl", preset.rpcUrl);
            } else {
                form.setValue("networkName", "");
                form.setValue("chainId", 1);
                form.setValue("rpcUrl", "");
            }
        }
    };

    const onSubmit = async (data: DeploymentFormData) => {
        try {
            await onDeploy({
                networkConfig: {
                    name: data.networkName,
                    chainId: data.chainId,
                    rpcUrl: data.rpcUrl,
                },
            });
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error("Deployment failed:", error);
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
                    <DialogTitle>Deploy to EVM Network</DialogTitle>
                    <DialogDescription>
                        Configure the RPC you want to use for deployment. Smartforge will deploy via your Privy linked
                        wallet—no private key sharing needed.
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
                                                    {network.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Choose a preset network or select Custom to configure your own
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Custom Network Configuration */}
                        {isCustomNetwork && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="networkName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Network Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="My Custom Network" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="chainId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Chain ID</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="1" {...field} />
                                            </FormControl>
                                            <FormDescription>The chain ID of your network</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="rpcUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RPC URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://rpc.example.com" {...field} />
                                            </FormControl>
                                            <FormDescription>The RPC endpoint for your network</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

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
