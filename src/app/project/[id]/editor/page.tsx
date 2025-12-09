"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StructEditor, MappingEditor, ConstructorEditor } from "@/components/contract-editor";
import type { Struct, Mapping, Constructor } from "@/schemas/contract.schema";
import { useProject, useUpdateProject, useDeployProject, useVerifyProject } from "@/hooks/use-projects";
import { DeployDialog } from "@/components/deploy-dialog";
import { CONTRACT_TEMPLATES } from "@/lib/contract-templates";
import { createPrivyApiClient } from "@/lib/privy-api";
import {
    Code2,
    Rocket,
    Save,
    ArrowLeft,
    FileCode,
    Database,
    Settings,
    FunctionSquare,
    Box,
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SolidityEditor } from "@/components/solidity-editor";
import { AIAssistant } from "@/components/ai-assistant";

type ParsedStructField = {
    name: string;
    type: string;
};

type ParsedStruct = {
    name: string;
    fields: ParsedStructField[];
};

type ParsedMapping = {
    name: string;
    keyType: string;
    valueType: string;
};

type ParsedFunctionParam = {
    name: string;
    type: string;
};

type ParsedFunction = {
    name: string;
    visibility?: string;
    stateMutability?: string;
    returns?: string;
    params: ParsedFunctionParam[];
};

type DesignVariable = {
    id: string;
    name: string;
    type: string;
    visibility: "public" | "private" | "internal" | "external";
};

type FunctionStepRequire = {
    id: string;
    type: "require";
    condition: string;
    message: string;
};

type FunctionStepStatement = {
    id: string;
    type: "statement";
    code: string;
};

type FunctionStepCall = {
    id: string;
    type: "call";
    targetFunctionId: string;
    args: string;
    callData?: string;
};

type FunctionStepMappingSet = {
    id: string;
    type: "setMapping";
    mappingId: string;
    keyExpr: string;
    valueExpr: string;
};

type FunctionStep = FunctionStepRequire | FunctionStepStatement | FunctionStepCall | FunctionStepMappingSet;

type DesignFunction = {
    id: string;
    name: string;
    visibility: "public" | "private" | "internal" | "external";
    stateMutability?: "view" | "pure" | "payable" | "nonpayable" | "constant";
    inputs: ParsedFunctionParam[];
    outputs?: string;
    steps?: FunctionStep[];
};

type DesignEventParam = {
    id: string;
    name: string;
    type: string;
};

type DesignEvent = {
    id: string;
    name: string;
    params: DesignEventParam[];
};

type NetworkInfo = {
    name?: string;
    chainId?: number;
    rpcUrl?: string;
};

type NetworkValue = DeploymentNetworkId | NetworkInfo | null | undefined;

const DEPLOYMENT_NETWORKS = [
    {
        id: "base-sepolia",
        label: "Base Sepolia",
        description: "Testnet · Chain ID 84532",
        chainId: 84532,
    },
    {
        id: "base-mainnet",
        label: "Base Mainnet",
        description: "Mainnet · Chain ID 8453",
        chainId: 8453,
    },
] as const;

type DeploymentNetworkId = (typeof DEPLOYMENT_NETWORKS)[number]["id"];

const DEFAULT_DEPLOYMENT_NETWORK: DeploymentNetworkId = "base-sepolia";

const findDeploymentNetworkMatch = (value?: string) => {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    return DEPLOYMENT_NETWORKS.find(
        (network) => network.id.toLowerCase() === normalized || network.label.toLowerCase() === normalized
    );
};

const ensureDeploymentNetwork = (network?: NetworkValue): DeploymentNetworkId => {
    if (!network) {
        return DEFAULT_DEPLOYMENT_NETWORK;
    }

    if (typeof network === "string") {
        const match = findDeploymentNetworkMatch(network);
        return (match?.id as DeploymentNetworkId) || DEFAULT_DEPLOYMENT_NETWORK;
    }

    if (typeof network === "object") {
        if (network.name) {
            const match = findDeploymentNetworkMatch(network.name);
            if (match) {
                return match.id;
            }
        }

        if (network.chainId) {
            const match = DEPLOYMENT_NETWORKS.find((n) => n.chainId === network.chainId);
            if (match) {
                return match.id;
            }
        }
    }

    return DEFAULT_DEPLOYMENT_NETWORK;
};

const getNetworkLabel = (network?: NetworkValue) => {
    if (!network) {
        return DEPLOYMENT_NETWORKS[0].label;
    }

    if (typeof network === "string") {
        const match = findDeploymentNetworkMatch(network);
        return match?.label || network;
    }

    if (typeof network === "object") {
        if (network.name && network.chainId) {
            return `${network.name} (Chain ID ${network.chainId})`;
        }
        if (network.name) {
            return network.name;
        }
        if (network.chainId) {
            const match = DEPLOYMENT_NETWORKS.find((n) => n.chainId === network.chainId);
            if (match) {
                return match.label;
            }
            return `Chain ID ${network.chainId}`;
        }
    }

    return "Custom Network";
};

const getNetworkChainId = (network?: NetworkValue): number | undefined => {
    if (!network) {
        return undefined;
    }

    if (typeof network === "string") {
        if (network === "base-mainnet") return 8453;
        if (network === "base-sepolia") return 84532;
        return undefined;
    }

    return network.chainId;
};

const getBaseScanAddressUrl = (address?: string, network?: NetworkValue): string | null => {
    const chainId = getNetworkChainId(network);
    if (!address || !chainId) return null;
    if (chainId === 84532) {
        return `https://sepolia.basescan.org/address/${address}`;
    }
    if (chainId === 8453) {
        return `https://basescan.org/address/${address}`;
    }
    return null;
};

function buildDesignSection(
    structs: Struct[],
    mappings: Mapping[],
    functions: DesignFunction[],
    ctor: Constructor | null,
    events: DesignEvent[]
): string | null {
    const lines: string[] = [];

    if (structs.length === 0 && mappings.length === 0 && functions.length === 0 && !ctor && events.length === 0) {
        return null;
    }

    lines.push("// === SMARTFORGE DESIGN START ===");

    if (structs.length > 0) {
        lines.push("// Structs generated from designer");
        for (const s of structs) {
            if (!s.name) continue;
            lines.push(`struct ${s.name} {`);
            for (const f of s.fields || []) {
                lines.push(`    ${f.type} ${f.name};`);
            }
            lines.push("}");
            lines.push("");
        }
    }

    if (mappings.length > 0) {
        lines.push("// Mappings generated from designer");
        mappings.forEach((m, index) => {
            const keyType = (m as any).keyType || "address";
            const valueType = (m as any).valueType || "uint256";
            const varName = (m as any).name || `mapping${index + 1}`;
            lines.push(`mapping(${keyType} => ${valueType}) public ${varName};`);
        });
        lines.push("");
    }

    // if (ctor) {
    //     lines.push("// Constructor generated from designer");
    //     const params = (ctor.parameters || []).map((p) => `${p.type} ${p.name}`).join(", ");
    //     const visibility = ctor.visibility || "public";
    //     const payable = ctor.isPayable ? "payable " : "";
    //     lines.push(`constructor(${params}) ${visibility} ${payable}{`);
    //     lines.push("    // TODO: add constructor logic");
    //     lines.push("}");
    //     lines.push("");
    // }

    if (events.length > 0) {
        lines.push("// Events generated from designer");
        for (const ev of events) {
            if (!ev.name.trim()) continue;
            const params = (ev.params || []).map((p) => `${p.type || "uint256"} ${p.name || ""}`.trim()).join(", ");
            lines.push(`event ${ev.name}(${params});`);
        }
        lines.push("");
    }

    if (functions.length > 0) {
        lines.push("// Functions generated from designer");
        for (const fn of functions) {
            const params = fn.inputs.map((p) => `${p.type} ${p.name}`).join(", ");
            const visibility = fn.visibility || "public";
            const mutability = fn.stateMutability ? ` ${fn.stateMutability}` : "";
            const returns = fn.outputs ? ` returns (${fn.outputs})` : "";
            lines.push(`function ${fn.name}(${params}) ${visibility}${mutability}${returns} {`);
            const steps = fn.steps || [];
            if (steps.length === 0) {
                lines.push("    // TODO: add function logic");
            } else {
                for (const step of steps) {
                    if (step.type === "require") {
                        const msg =
                            step.message && step.message.trim().length > 0
                                ? `, "${step.message.replace(/"/g, '\\"')}"`
                                : "";
                        lines.push(`    require(${step.condition || "false"}${msg});`);
                    } else if (step.type === "statement") {
                        if (step.code.trim().length > 0) {
                            lines.push(`    ${step.code.trim()}`);
                        }
                    } else if (step.type === "call") {
                        const target = functions.find((f) => f.id === step.targetFunctionId);
                        const targetName = target?.name || "/* unknownFunction */";
                        const args = step.args.trim();
                        lines.push(`    ${targetName}(${args.length > 0 ? args : ""});`);
                        if (step.callData && step.callData.trim().length > 0) {
                            lines.push(`    // calldata: ${step.callData.trim()}`);
                        }
                    } else if (step.type === "setMapping") {
                        const index = mappings.findIndex((m) => (m as any).id === step.mappingId);
                        const varName =
                            index >= 0 ? (mappings[index] as any).name || `mapping${index + 1}` : "/* mapping */";
                        const key = step.keyExpr.trim() || "/* key */";
                        const value = step.valueExpr.trim() || "/* value */";
                        lines.push(`    ${varName}[${key}] = ${value};`);
                    }
                }
            }
            lines.push("}");
            lines.push("");
        }
    }

    lines.push("// === SMARTFORGE DESIGN END ===");

    return lines.join("\n");
}

function applyDesignSectionToCode(code: string, section: string | null): string {
    const startMarker = "// === SMARTFORGE DESIGN START ===";
    const endMarker = "// === SMARTFORGE DESIGN END ===";

    // First, remove any existing SMARTFORGE section
    let cleaned = code;
    const existingStart = cleaned.indexOf(startMarker);
    if (existingStart !== -1) {
        const existingEnd = cleaned.indexOf(endMarker, existingStart);
        if (existingEnd !== -1) {
            const afterEnd = cleaned.indexOf("\n", existingEnd + endMarker.length);
            cleaned = cleaned.slice(0, existingStart) + (afterEnd !== -1 ? cleaned.slice(afterEnd + 1) : "");
        } else {
            cleaned = cleaned.slice(0, existingStart);
        }
    }

    if (!section) {
        return cleaned;
    }

    // Insert the section inside the first contract's braces if possible
    const contractIndex = cleaned.indexOf("contract ");
    if (contractIndex === -1) {
        const sep = cleaned.endsWith("\n") ? "" : "\n";
        return cleaned + sep + "\n" + section + "\n";
    }

    const openBraceIndex = cleaned.indexOf("{", contractIndex);
    if (openBraceIndex === -1) {
        const sep = cleaned.endsWith("\n") ? "" : "\n";
        return cleaned + sep + "\n" + section + "\n";
    }

    // Find matching closing brace for the contract using a simple brace counter
    let depth = 0;
    let closeBraceIndex = -1;
    for (let i = openBraceIndex; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (ch === "{") depth++;
        if (ch === "}") {
            depth--;
            if (depth === 0) {
                closeBraceIndex = i;
                break;
            }
        }
    }

    if (closeBraceIndex === -1) {
        const sep = cleaned.endsWith("\n") ? "" : "\n";
        return cleaned + sep + "\n" + section + "\n";
    }

    const before = cleaned.slice(0, closeBraceIndex);
    const after = cleaned.slice(closeBraceIndex);
    const sepBefore = before.endsWith("\n") ? "" : "\n";
    return before + sepBefore + "\n" + section + "\n" + after;
}

function parseStructs(code: string): ParsedStruct[] {
    const structs: ParsedStruct[] = [];
    const structRegex = /struct\s+(\w+)\s*\{([\s\S]*?)\}/g;
    let match: RegExpExecArray | null;

    while ((match = structRegex.exec(code)) !== null) {
        const [, name, body] = match;
        const fields: ParsedStructField[] = [];

        const lines = body
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith("//"));

        for (const line of lines) {
            // basic pattern: type name;
            const fieldMatch = /^([a-zA-Z0-9_\[\]]+)\s+([a-zA-Z0-9_]+)\s*;/.exec(line);
            if (fieldMatch) {
                fields.push({
                    type: fieldMatch[1],
                    name: fieldMatch[2],
                });
            }
        }

        structs.push({ name, fields });
    }

    return structs;
}

function parseMappings(code: string): ParsedMapping[] {
    const mappings: ParsedMapping[] = [];
    const mappingRegex = /mapping\s*\(\s*([^)]+?)\s*=>\s*([^)]+?)\s*\)\s*([a-zA-Z0-9_]+)\s*;/g;
    let match: RegExpExecArray | null;

    while ((match = mappingRegex.exec(code)) !== null) {
        const [, key, value, name] = match;
        mappings.push({
            name,
            keyType: key.trim(),
            valueType: value.trim(),
        });
    }

    return mappings;
}

function parseFunctions(code: string): ParsedFunction[] {
    const functions: ParsedFunction[] = [];
    const functionRegex = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*([^{};]*)/g;
    let match: RegExpExecArray | null;

    while ((match = functionRegex.exec(code)) !== null) {
        const [, name, paramsRaw, rest] = match;

        const params: ParsedFunctionParam[] = [];
        if (paramsRaw.trim()) {
            const parts = paramsRaw.split(",").map((p) => p.trim());
            for (const part of parts) {
                const pieces = part.split(/\s+/);
                if (pieces.length >= 2) {
                    const type = pieces.slice(0, pieces.length - 1).join(" ");
                    const paramName = pieces[pieces.length - 1];
                    params.push({ type, name: paramName });
                }
            }
        }

        const visibilityMatch = /(public|private|internal|external)/.exec(rest);
        const stateMatch = /(view|pure|payable|nonpayable|constant)/.exec(rest);
        const returnsMatch = /returns\s*\(([^)]*)\)/.exec(rest);

        functions.push({
            name,
            params,
            visibility: visibilityMatch?.[1],
            stateMutability: stateMatch?.[1],
            returns: returnsMatch?.[1]?.trim(),
        });
    }

    return functions;
}

export default function ProjectEditorPage() {
    const { ready, authenticated } = usePrivy();
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const { data: project, isLoading } = useProject(projectId);
    const updateProject = useUpdateProject();
    const deployProject = useDeployProject();
    const verifyProject = useVerifyProject();
    const { getAccessToken } = usePrivy();
    const apiClient = useMemo(() => createPrivyApiClient(getAccessToken), [getAccessToken]);

    const [sourceCode, setSourceCode] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [isWatchingDeployment, setIsWatchingDeployment] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState<DeploymentNetworkId>(DEFAULT_DEPLOYMENT_NETWORK);
    const [isUpdatingNetwork, setIsUpdatingNetwork] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);
    const [compilationResult, setCompilationResult] = useState<any>(null);

    const [variables, setVariables] = useState<DesignVariable[]>([]);
    const [designStructs, setDesignStructs] = useState<Struct[]>([]);
    const [designMappings, setDesignMappings] = useState<Mapping[]>([]);
    const [designFunctions, setDesignFunctions] = useState<DesignFunction[]>([]);
    const [designConstructor, setDesignConstructor] = useState<Constructor | null>(null);
    const [designEvents, setDesignEvents] = useState<DesignEvent[]>([]);

    const [editingStruct, setEditingStruct] = useState<Struct | null>(null);
    const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);

    const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
    const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
    const [variableForm, setVariableForm] = useState<{
        name: string;
        type: string;
        visibility: DesignVariable["visibility"];
    }>({
        name: "",
        type: "uint256",
        visibility: "public",
    });

    const [isFunctionDialogOpen, setIsFunctionDialogOpen] = useState(false);
    const [editingFunctionId, setEditingFunctionId] = useState<string | null>(null);
    const [functionForm, setFunctionForm] = useState<{
        name: string;
    }>({
        name: "",
    });
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [eventForm, setEventForm] = useState<{
        name: string;
        params: DesignEventParam[];
    }>({
        name: "",
        params: [],
    });

    const [logicDialogFunctionId, setLogicDialogFunctionId] = useState<string | null>(null);
    const [requireForm, setRequireForm] = useState<{
        condition: string;
        message: string;
    }>({ condition: "", message: "" });
    const [statementForm, setStatementForm] = useState<string>("");
    const [mappingForm, setMappingForm] = useState<{
        mappingId: string;
        keyExpr: string;
        valueExpr: string;
    }>({ mappingId: "", keyExpr: "", valueExpr: "" });
    const [callForm, setCallForm] = useState<{
        targetFunctionId: string;
        args: string;
        callData: string;
    }>({ targetFunctionId: "", args: "", callData: "" });

    const parsedStructs = useMemo(() => (sourceCode ? parseStructs(sourceCode) : []), [sourceCode]);

    const parsedMappings = useMemo(() => (sourceCode ? parseMappings(sourceCode) : []), [sourceCode]);

    const parsedFunctions = useMemo(() => (sourceCode ? parseFunctions(sourceCode) : []), [sourceCode]);

    useEffect(() => {
        if (ready && !authenticated) {
            router.push("/login");
        }
    }, [ready, authenticated, router]);

    useEffect(() => {
        if (project) {
            setProjectName(project.name);
            setSourceCode(project.sourceCode || CONTRACT_TEMPLATES[project.template] || CONTRACT_TEMPLATES.Custom);

            const metadata = (project.metadata || {}) as any;
            const design = metadata.design || {};
            setVariables(design.variables || []);
            setDesignStructs(design.structs || []);
            setDesignMappings(design.mappings || []);
            setDesignFunctions(design.functions || []);
            setDesignConstructor(design.constructor || null);
            setDesignEvents(design.events || []);
            setSelectedNetwork(ensureDeploymentNetwork(project.targetNetwork));
        }
    }, [project]);

    useEffect(() => {
        setSourceCode((prev) =>
            applyDesignSectionToCode(
                prev,
                buildDesignSection(designStructs, designMappings, designFunctions, designConstructor, designEvents)
            )
        );
    }, [designStructs, designMappings, designFunctions, designConstructor, designEvents]);

    const deployedChainId = project ? getNetworkChainId(project.deployedNetwork) : undefined;
    const isBaseScanSupported = deployedChainId === 8453 || deployedChainId === 84532;
    const deployedExplorerUrl = project
        ? getBaseScanAddressUrl(project.deployedAddress, project.deployedNetwork)
        : null;
    const verificationStatus = project?.verificationStatus;
    const verificationBadgeVariant =
        verificationStatus === "success"
            ? "default"
            : verificationStatus === "failed"
              ? "destructive"
              : verificationStatus === "pending"
                ? "secondary"
                : "outline";
    const verificationBadgeLabel =
        verificationStatus === "success"
            ? "Verified"
            : verificationStatus === "failed"
              ? "Failed"
              : verificationStatus === "pending"
                ? "Pending"
                : "Not started";

    const handleNetworkChange = async (value: DeploymentNetworkId) => {
        if (!project) return;

        const previousNetwork = selectedNetwork;
        setSelectedNetwork(value);
        setIsUpdatingNetwork(true);
        try {
            await updateProject.mutateAsync({
                id: project._id,
                targetNetwork: value,
            });
            toast.success("Deployment network updated", {
                description: `New deployments will target ${getNetworkLabel(value)}.`,
            });
        } catch (error) {
            setSelectedNetwork(previousNetwork);
            toast.error("Failed to update network", {
                description: "Unable to update deployment network. Please try again.",
            });
        } finally {
            setIsUpdatingNetwork(false);
        }
    };

    const handleCompile = async () => {
        if (!sourceCode.trim()) {
            toast.error("No code to compile");
            return;
        }

        setIsCompiling(true);
        try {
            const { data } = await apiClient.post("/compile", { sourceCode });

            setCompilationResult(data);

            if (data.success) {
                toast.success("Compilation Successful", {
                    description:
                        data.warnings.length > 0
                            ? `Compiled with ${data.warnings.length} warning(s)`
                            : "Contract compiled successfully",
                });
            } else {
                toast.error("Compilation Failed", {
                    description: `${data.errors.length} error(s) found`,
                });
            }
        } catch (error: any) {
            toast.error("Compilation Error", {
                description: error.response?.data?.error || "Failed to compile contract",
            });
        } finally {
            setIsCompiling(false);
        }
    };

    const handleSave = async () => {
        if (!project) return;

        setIsSaving(true);
        try {
            await updateProject.mutateAsync({
                id: project._id,
                sourceCode,
                metadata: {
                    ...(project.metadata || {}),
                    design: {
                        variables,
                        structs: designStructs,
                        mappings: designMappings,
                        functions: designFunctions,
                        constructor: designConstructor,
                        events: designEvents,
                    },
                },
                name: projectName,
            });
            toast.success("Saved", {
                description: "Project updated successfully.",
            });
        } catch (error) {
            toast.error("Error", {
                description: "Failed to save contract code.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeploy = async (deploymentData: {
        networkConfig: { name: string; chainId: number; rpcUrl: string };
    }) => {
        if (!project) return;

        try {
            await deployProject.mutateAsync({
                id: project._id,
                networkConfig: deploymentData.networkConfig,
            });
            toast.success("Deployment Started", {
                description: `Deploying your contract to ${deploymentData.networkConfig.name}. We'll notify you once it completes.`,
            });
            setIsWatchingDeployment(true);
        } catch (error) {
            toast.error("Deployment Failed", {
                description: "Failed to deploy contract. Please try again.",
            });
        }
    };

    const handleVerifyContract = async () => {
        if (!project) return;
        if (!isBaseScanSupported) {
            toast.error("Unsupported network", {
                description: "Contract verification is currently limited to Base networks.",
            });
            return;
        }

        try {
            await verifyProject.mutateAsync(project._id);
            toast.success("Verification submitted", {
                description: "BaseScan is verifying your source. Status updates will appear below.",
            });
        } catch (error: any) {
            toast.error("Verification failed", {
                description: error?.response?.data?.error || error?.message || "Unable to start verification.",
            });
        }
    };

    useEffect(() => {
        if (!isWatchingDeployment || !project) return;

        if (project.deploymentStatus === "deployed") {
            toast.success("Deployment Successful", {
                description: project.deployedAddress
                    ? `Contract deployed to ${getNetworkLabel(
                          project.deployedNetwork ?? selectedNetwork
                      )} at ${project.deployedAddress}`
                    : "Contract deployment completed.",
            });
            setIsWatchingDeployment(false);
        } else if (project.deploymentStatus === "failed") {
            toast.error("Deployment Failed", {
                description: "Deployment failed on-chain. Check your contract or try again.",
            });
            setIsWatchingDeployment(false);
        }
    }, [isWatchingDeployment, project, selectedNetwork]);

    if (!ready || isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <Skeleton className="h-12 w-64 mb-4" />
                    <Skeleton className="h-[600px] w-full" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">Project not found</p>
                        <Button asChild className="mt-4">
                            <Link href="/">Go Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    {project.template} Contract
                                    <Badge variant="outline" className="px-2 py-0 text-xs">
                                        {getNetworkLabel(selectedNetwork)}
                                    </Badge>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Deployment Network
                                </span>
                                <Select
                                    value={selectedNetwork}
                                    disabled={isUpdatingNetwork || deployProject.isPending || !project}
                                    onValueChange={(value) => handleNetworkChange(value as DeploymentNetworkId)}
                                >
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue placeholder="Select network" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPLOYMENT_NETWORKS.map((network) => (
                                            <SelectItem key={network.id} value={network.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{network.label}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {network.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={handleCompile} disabled={isCompiling}>
                                {isCompiling ? (
                                    <>
                                        <Code2 className="w-4 h-4 mr-2 animate-pulse" />
                                        Compiling...
                                    </>
                                ) : compilationResult?.success ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                        Compile
                                    </>
                                ) : compilationResult?.errors?.length > 0 ? (
                                    <>
                                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                        Compile
                                    </>
                                ) : (
                                    <>
                                        <Code2 className="w-4 h-4 mr-2" />
                                        Compile
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                            <DeployDialog
                                projectId={project._id}
                                onSuccess={() => {
                                    // Refresh project data after successful deployment
                                    // refetch();
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 container mx-auto px-4 py-6">
                <Tabs defaultValue="code" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="code">
                            <Code2 className="w-4 h-4 mr-2" />
                            Code
                        </TabsTrigger>
                        <TabsTrigger value="variables">
                            <Box className="w-4 h-4 mr-2" />
                            Variables
                        </TabsTrigger>
                        <TabsTrigger value="mappings">
                            <Database className="w-4 h-4 mr-2" />
                            Mappings
                        </TabsTrigger>
                        <TabsTrigger value="structs">
                            <FileCode className="w-4 h-4 mr-2" />
                            Structs
                        </TabsTrigger>
                        <TabsTrigger value="functions">
                            <FunctionSquare className="w-4 h-4 mr-2" />
                            Functions
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="code" className="mt-6">
                        <Card className="border-primary/20">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Solidity Code</CardTitle>
                                    {compilationResult && (
                                        <div className="flex items-center gap-4 text-sm">
                                            {compilationResult.success ? (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>No errors</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <XCircle className="w-4 h-4" />
                                                    <span>{compilationResult.errors.length} error(s)</span>
                                                </div>
                                            )}
                                            {compilationResult.warnings?.length > 0 && (
                                                <div className="flex items-center gap-1 text-yellow-600">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{compilationResult.warnings.length} warning(s)</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SolidityEditor value={sourceCode} onChange={setSourceCode} height="600px" />

                                {/* Compilation Results */}
                                {compilationResult && (
                                    <div className="space-y-3">
                                        {compilationResult.errors?.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                                                    <XCircle className="w-4 h-4" />
                                                    Errors
                                                </h4>
                                                <div className="space-y-2">
                                                    {compilationResult.errors.map((error: any, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md"
                                                        >
                                                            <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap">
                                                                {error.formattedMessage || error.message}
                                                            </pre>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {compilationResult.warnings?.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold text-yellow-600 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Warnings
                                                </h4>
                                                <div className="space-y-2">
                                                    {compilationResult.warnings.map((warning: any, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
                                                        >
                                                            <pre className="text-xs text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
                                                                {warning.formattedMessage || warning.message}
                                                            </pre>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {compilationResult.success && (
                                            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                                                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="text-sm font-medium">
                                                        Contract compiled successfully!
                                                        {compilationResult.contractName && (
                                                            <span className="ml-2 font-mono text-xs">
                                                                {compilationResult.contractName}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI Assistant */}
                        <AIAssistant currentCode={sourceCode} onCodeGenerated={(code) => setSourceCode(code)} />
                    </TabsContent>

                    <TabsContent value="variables" className="mt-6">
                        <Card className="border-primary/20">
                            <CardHeader>
                                <CardTitle>State Variables</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Design your state variables here. They are stored in the project metadata and
                                        can later be used to generate Solidity code.
                                    </p>
                                    <Badge variant="outline">
                                        {variables.length} variable
                                        {variables.length === 1 ? "" : "s"}
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    {variables.map((variable) => (
                                        <div
                                            key={variable.id}
                                            className="flex items-center justify-between rounded-lg border border-primary/15 bg-card/60 px-3 py-2 gap-2"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm text-foreground">
                                                    {variable.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {variable.type} ({variable.visibility})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        setEditingVariableId(variable.id);
                                                        setVariableForm({
                                                            name: variable.name,
                                                            type: variable.type,
                                                            visibility: variable.visibility,
                                                        });
                                                        setIsVariableDialogOpen(true);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-xs text-destructive"
                                                    onClick={() =>
                                                        setVariables((prev) => prev.filter((v) => v.id !== variable.id))
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {variables.length === 0 && (
                                        <p className="text-xs text-muted-foreground">No variables defined yet.</p>
                                    )}
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setEditingVariableId(null);
                                        setVariableForm({
                                            name: "",
                                            type: "uint256",
                                            visibility: "public",
                                        });
                                        setIsVariableDialogOpen(true);
                                    }}
                                >
                                    Add Variable
                                </Button>

                                <Dialog open={isVariableDialogOpen} onOpenChange={setIsVariableDialogOpen}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingVariableId ? "Edit Variable" : "Add Variable"}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="var-name">Name</Label>
                                                <Input
                                                    id="var-name"
                                                    value={variableForm.name}
                                                    onChange={(e) =>
                                                        setVariableForm((prev) => ({
                                                            ...prev,
                                                            name: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="totalSupply"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="var-type">Type</Label>
                                                <Input
                                                    id="var-type"
                                                    value={variableForm.type}
                                                    onChange={(e) =>
                                                        setVariableForm((prev) => ({
                                                            ...prev,
                                                            type: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="uint256"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="var-vis">Visibility</Label>
                                                <select
                                                    id="var-vis"
                                                    className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                                    value={variableForm.visibility}
                                                    onChange={(e) =>
                                                        setVariableForm((prev) => ({
                                                            ...prev,
                                                            visibility: e.target.value as DesignVariable["visibility"],
                                                        }))
                                                    }
                                                >
                                                    <option value="public">public</option>
                                                    <option value="private">private</option>
                                                    <option value="internal">internal</option>
                                                    <option value="external">external</option>
                                                </select>
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-4">
                                            <Button variant="outline" onClick={() => setIsVariableDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    if (!variableForm.name.trim()) {
                                                        return;
                                                    }

                                                    if (editingVariableId) {
                                                        setVariables((prev) =>
                                                            prev.map((v) =>
                                                                v.id === editingVariableId
                                                                    ? {
                                                                          ...v,
                                                                          name: variableForm.name.trim(),
                                                                          type: variableForm.type.trim(),
                                                                          visibility: variableForm.visibility,
                                                                      }
                                                                    : v
                                                            )
                                                        );
                                                    } else {
                                                        const newVariable: DesignVariable = {
                                                            id: Date.now().toString(),
                                                            name: variableForm.name.trim(),
                                                            type: variableForm.type.trim() || "uint256",
                                                            visibility: variableForm.visibility,
                                                        };

                                                        setVariables((prev) => [...prev, newVariable]);

                                                        // Also append to Solidity source code
                                                        setSourceCode((prev) => {
                                                            const declaration = `${newVariable.type} ${newVariable.visibility} ${newVariable.name};`;
                                                            if (!prev) {
                                                                return declaration + "\n";
                                                            }

                                                            const contractIndex = prev.indexOf("contract ");
                                                            if (contractIndex !== -1) {
                                                                const openBraceIndex = prev.indexOf("{", contractIndex);
                                                                if (openBraceIndex !== -1) {
                                                                    const afterBraceNewline = prev.indexOf(
                                                                        "\n",
                                                                        openBraceIndex
                                                                    );
                                                                    if (afterBraceNewline !== -1) {
                                                                        return (
                                                                            prev.slice(0, afterBraceNewline + 1) +
                                                                            "    " +
                                                                            declaration +
                                                                            "\n" +
                                                                            prev.slice(afterBraceNewline + 1)
                                                                        );
                                                                    }
                                                                }
                                                            }

                                                            return prev + "\n" + declaration + "\n";
                                                        });
                                                    }

                                                    setIsVariableDialogOpen(false);
                                                }}
                                            >
                                                Save
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="mappings" className="mt-6">
                        <Card className="border-primary/20">
                            <CardHeader>
                                <CardTitle>Mappings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Design your mappings here. They are stored in project metadata and can later
                                            be used to generate Solidity code.
                                        </p>
                                        <Badge variant="outline">
                                            {designMappings.length} mapping
                                            {designMappings.length === 1 ? "" : "s"}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {designMappings.map((mapping) => (
                                            <div
                                                key={mapping.id}
                                                className="flex flex-col gap-1 rounded-lg border border-primary/15 bg-card/60 px-3 py-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm text-foreground">mapping</span>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs"
                                                            onClick={() => setEditingMapping(mapping)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-xs text-destructive"
                                                            onClick={() =>
                                                                setDesignMappings((prev) =>
                                                                    prev.filter((m) => m.id !== mapping.id)
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                                <code className="text-xs px-2 py-1 rounded bg-muted border border-border">
                                                    mapping({mapping.keyType} =&gt; {mapping.valueType});
                                                </code>
                                                <div className="mt-2 space-y-1">
                                                    <span className="text-[11px] text-muted-foreground">Maps to</span>
                                                    <select
                                                        className="w-full px-3 py-1.5 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary text-xs"
                                                        value={
                                                            mapping.associatedStruct
                                                                ? `struct:${mapping.associatedStruct}`
                                                                : (mapping as any).associatedVariableId
                                                                  ? `var:${(mapping as any).associatedVariableId}`
                                                                  : "custom"
                                                        }
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setDesignMappings((prev) =>
                                                                prev.map((m) => {
                                                                    if (m.id !== mapping.id) return m;
                                                                    if (value === "custom") {
                                                                        return {
                                                                            ...m,
                                                                            associatedStruct: undefined,
                                                                            associatedVariableId: undefined,
                                                                        } as Mapping;
                                                                    }
                                                                    if (value.startsWith("struct:")) {
                                                                        const structId = value.replace("struct:", "");
                                                                        const struct = designStructs.find(
                                                                            (s) => s.id === structId
                                                                        );
                                                                        return {
                                                                            ...m,
                                                                            associatedStruct: structId,
                                                                            associatedVariableId: undefined,
                                                                            valueType: struct?.name || m.valueType,
                                                                        } as Mapping;
                                                                    }
                                                                    if (value.startsWith("var:")) {
                                                                        const varId = value.replace("var:", "");
                                                                        const variable = variables.find(
                                                                            (v) => v.id === varId
                                                                        );
                                                                        return {
                                                                            ...m,
                                                                            associatedStruct: undefined,
                                                                            associatedVariableId: varId,
                                                                            valueType: variable?.type || m.valueType,
                                                                        } as any;
                                                                    }
                                                                    return m;
                                                                })
                                                            );
                                                        }}
                                                    >
                                                        <option value="custom">Custom type</option>
                                                        {designStructs.length > 0 && (
                                                            <optgroup label="Structs">
                                                                {designStructs.map((s) => (
                                                                    <option key={s.id} value={`struct:${s.id}`}>
                                                                        {s.name}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {variables.length > 0 && (
                                                            <optgroup label="Variables">
                                                                {variables.map((v) => (
                                                                    <option key={v.id} value={`var:${v.id}`}>
                                                                        {v.name} ({v.type})
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                        {designMappings.length === 0 && (
                                            <p className="text-xs text-muted-foreground">No mappings defined yet.</p>
                                        )}
                                    </div>

                                    {editingMapping && (
                                        <MappingEditor
                                            mapping={editingMapping}
                                            onCancel={() => setEditingMapping(null)}
                                            onSave={(updated) => {
                                                setDesignMappings((prev) =>
                                                    prev.some((m) => m.id === updated.id)
                                                        ? prev.map((m) => (m.id === updated.id ? updated : m))
                                                        : [...prev, updated]
                                                );
                                                setEditingMapping(null);
                                            }}
                                        />
                                    )}

                                    {!editingMapping && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setEditingMapping({
                                                    id: "",
                                                    keyType: "address",
                                                    valueType: "uint256",
                                                    isNested: false,
                                                } as Mapping)
                                            }
                                        >
                                            Add Mapping
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="structs" className="mt-6">
                        <Card className="border-primary/20">
                            <CardHeader>
                                <CardTitle>Structs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Design your structs here. They are stored in project metadata and can later
                                            be used to generate Solidity code.
                                        </p>
                                        <Badge variant="outline">
                                            {designStructs.length} struct
                                            {designStructs.length === 1 ? "" : "s"}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {designStructs.map((struct) => (
                                            <div
                                                key={struct.id}
                                                className="rounded-lg border border-primary/15 bg-card/60 p-3"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm text-foreground">
                                                        {struct.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {struct.fields.length} field
                                                            {struct.fields.length !== 1 ? "s" : ""}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs"
                                                            onClick={() => setEditingStruct(struct)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-xs text-destructive"
                                                            onClick={() =>
                                                                setDesignStructs((prev) =>
                                                                    prev.filter((s) => s.id !== struct.id)
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="rounded-md border border-border bg-muted/40 overflow-hidden">
                                                    <div className="grid grid-cols-[1.5fr,2fr] gap-x-3 text-[11px] px-3 py-1.5 border-b border-border/60 bg-muted/70 font-medium text-muted-foreground">
                                                        <span>Field</span>
                                                        <span>Type</span>
                                                    </div>
                                                    <div className="divide-y divide-border/60">
                                                        {struct.fields.map((field) => (
                                                            <div
                                                                key={field.name}
                                                                className="grid grid-cols-[1.5fr,2fr] gap-x-3 text-xs px-3 py-1.5"
                                                            >
                                                                <span className="font-mono text-foreground">
                                                                    {field.name}
                                                                </span>
                                                                <span className="font-mono text-muted-foreground">
                                                                    {field.type}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {designStructs.length === 0 && (
                                            <p className="text-xs text-muted-foreground">No structs defined yet.</p>
                                        )}
                                    </div>

                                    {editingStruct && (
                                        <StructEditor
                                            struct={editingStruct}
                                            onCancel={() => setEditingStruct(null)}
                                            onSave={(updated) => {
                                                setDesignStructs((prev) =>
                                                    prev.some((s) => s.id === updated.id)
                                                        ? prev.map((s) => (s.id === updated.id ? updated : s))
                                                        : [...prev, updated]
                                                );
                                                setEditingStruct(null);
                                            }}
                                        />
                                    )}

                                    {!editingStruct && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setEditingStruct({
                                                    id: "",
                                                    name: "",
                                                    fields: [],
                                                } as Struct)
                                            }
                                        >
                                            Add Struct
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="functions" className="mt-6">
                        <div className="space-y-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <CardTitle>Functions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Track your contract functions here. They are stored in project metadata
                                                and used to generate Solidity stubs.
                                            </p>
                                            <Badge variant="outline">
                                                {designFunctions.length} function
                                                {designFunctions.length === 1 ? "" : "s"}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            {designFunctions.map((fn) => {
                                                const signature = [
                                                    "function",
                                                    fn.name,
                                                    `(${fn.inputs.map((p) => `${p.type} ${p.name}`).join(", ")})`,
                                                    fn.visibility,
                                                    fn.stateMutability,
                                                    fn.outputs ? `returns (${fn.outputs})` : undefined,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ");

                                                return (
                                                    <div
                                                        key={fn.id}
                                                        className="flex flex-col gap-1 rounded-lg border border-primary/15 bg-card/60 px-3 py-2"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-sm text-foreground">
                                                                {fn.name}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                    onClick={() => {
                                                                        setLogicDialogFunctionId(fn.id);
                                                                    }}
                                                                >
                                                                    Logic
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                    onClick={() => {
                                                                        setEditingFunctionId(fn.id);
                                                                        setFunctionForm({ name: fn.name });
                                                                        setIsFunctionDialogOpen(true);
                                                                    }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-xs text-destructive"
                                                                    onClick={() =>
                                                                        setDesignFunctions((prev) =>
                                                                            prev.filter((f) => f.id !== fn.id)
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <code className="text-xs px-2 py-1 rounded bg-muted border border-border overflow-x-auto">
                                                            {signature};
                                                        </code>
                                                    </div>
                                                );
                                            })}
                                            {designFunctions.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    No functions defined yet.
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingFunctionId(null);
                                                setFunctionForm({ name: "" });
                                                setIsFunctionDialogOpen(true);
                                            }}
                                        >
                                            Add Function
                                        </Button>

                                        <Dialog open={isFunctionDialogOpen} onOpenChange={setIsFunctionDialogOpen}>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        {editingFunctionId ? "Edit Function" : "Add Function"}
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="fn-name">Name</Label>
                                                        <Input
                                                            id="fn-name"
                                                            value={functionForm.name}
                                                            onChange={(e) => setFunctionForm({ name: e.target.value })}
                                                            placeholder="transfer"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className="mt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsFunctionDialogOpen(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            if (!functionForm.name.trim()) return;

                                                            if (editingFunctionId) {
                                                                setDesignFunctions((prev) =>
                                                                    prev.map((f) =>
                                                                        f.id === editingFunctionId
                                                                            ? {
                                                                                  ...f,
                                                                                  name: functionForm.name.trim(),
                                                                              }
                                                                            : f
                                                                    )
                                                                );
                                                            } else {
                                                                setDesignFunctions((prev) => [
                                                                    ...prev,
                                                                    {
                                                                        id: Date.now().toString(),
                                                                        name: functionForm.name.trim(),
                                                                        visibility: "public",
                                                                        stateMutability: undefined,
                                                                        inputs: [],
                                                                        outputs: undefined,
                                                                    },
                                                                ]);
                                                            }

                                                            setIsFunctionDialogOpen(false);
                                                        }}
                                                    >
                                                        Save
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Function Logic Dialog */}
                                        <Dialog
                                            open={!!logicDialogFunctionId}
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setLogicDialogFunctionId(null);
                                                    setRequireForm({ condition: "", message: "" });
                                                    setStatementForm("");
                                                    setMappingForm({
                                                        mappingId: "",
                                                        keyExpr: "",
                                                        valueExpr: "",
                                                    });
                                                    setCallForm({
                                                        targetFunctionId: "",
                                                        args: "",
                                                        callData: "",
                                                    });
                                                }
                                            }}
                                        >
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Function Logic</DialogTitle>
                                                </DialogHeader>
                                                {(() => {
                                                    const fn = designFunctions.find(
                                                        (f) => f.id === logicDialogFunctionId
                                                    );
                                                    if (!fn) {
                                                        return (
                                                            <p className="text-sm text-muted-foreground">
                                                                No function selected.
                                                            </p>
                                                        );
                                                    }

                                                    const steps = fn.steps || [];

                                                    return (
                                                        <div className="space-y-4">
                                                            <p className="text-xs text-muted-foreground">
                                                                Build this function using simple steps. These steps will
                                                                be converted into Solidity code.
                                                            </p>

                                                            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-md p-2">
                                                                {steps.length === 0 && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        No steps yet. Add a <code>require</code> or
                                                                        custom statement below.
                                                                    </p>
                                                                )}
                                                                {steps.map((step) => (
                                                                    <div
                                                                        key={step.id}
                                                                        className="flex items-start justify-between gap-2 rounded border border-border/60 bg-muted/40 px-2 py-1.5"
                                                                    >
                                                                        <div className="text-xs">
                                                                            {step.type === "require" && (
                                                                                <>
                                                                                    <span className="font-semibold">
                                                                                        require
                                                                                    </span>{" "}
                                                                                    <span className="font-mono">
                                                                                        ({step.condition}
                                                                                        {step.message
                                                                                            ? `, "${step.message}"`
                                                                                            : ""}
                                                                                        );
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                            {step.type === "statement" && (
                                                                                <>
                                                                                    <span className="font-semibold">
                                                                                        statement
                                                                                    </span>{" "}
                                                                                    <span className="font-mono">
                                                                                        {step.code}
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                            {step.type === "setMapping" && (
                                                                                <>
                                                                                    <span className="font-semibold">
                                                                                        mapping
                                                                                    </span>{" "}
                                                                                    <span className="font-mono">
                                                                                        [{step.keyExpr}] ={" "}
                                                                                        {step.valueExpr};
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                            {step.type === "call" && (
                                                                                <>
                                                                                    <span className="font-semibold">
                                                                                        call
                                                                                    </span>{" "}
                                                                                    <span className="font-mono">
                                                                                        ({step.args || "/* no args */"})
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-[10px] text-destructive"
                                                                            onClick={() => {
                                                                                setDesignFunctions((prev) =>
                                                                                    prev.map((f) =>
                                                                                        f.id === fn.id
                                                                                            ? {
                                                                                                  ...f,
                                                                                                  steps: (
                                                                                                      f.steps || []
                                                                                                  ).filter(
                                                                                                      (s) =>
                                                                                                          s.id !==
                                                                                                          step.id
                                                                                                  ),
                                                                                              }
                                                                                            : f
                                                                                    )
                                                                                );
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">
                                                                        Add <code>require</code> step
                                                                    </Label>
                                                                    <Input
                                                                        placeholder="condition (e.g. amount > 0)"
                                                                        value={requireForm.condition}
                                                                        onChange={(e) =>
                                                                            setRequireForm((prev) => ({
                                                                                ...prev,
                                                                                condition: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Input
                                                                        placeholder='error message (e.g. "Invalid amount")'
                                                                        value={requireForm.message}
                                                                        onChange={(e) =>
                                                                            setRequireForm((prev) => ({
                                                                                ...prev,
                                                                                message: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="mt-1"
                                                                        onClick={() => {
                                                                            if (!requireForm.condition.trim()) return;
                                                                            const newStep: FunctionStepRequire = {
                                                                                id: Date.now().toString(),
                                                                                type: "require",
                                                                                condition: requireForm.condition.trim(),
                                                                                message: requireForm.message.trim(),
                                                                            };
                                                                            setDesignFunctions((prev) =>
                                                                                prev.map((f) =>
                                                                                    f.id === fn.id
                                                                                        ? {
                                                                                              ...f,
                                                                                              steps: [
                                                                                                  ...(f.steps || []),
                                                                                                  newStep,
                                                                                              ],
                                                                                          }
                                                                                        : f
                                                                                )
                                                                            );
                                                                            setRequireForm({
                                                                                condition: "",
                                                                                message: "",
                                                                            });
                                                                        }}
                                                                    >
                                                                        Add require
                                                                    </Button>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">
                                                                        Add custom statement
                                                                    </Label>
                                                                    <Input
                                                                        placeholder="e.g. balance[msg.sender] += amount;"
                                                                        value={statementForm}
                                                                        onChange={(e) =>
                                                                            setStatementForm(e.target.value)
                                                                        }
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="mt-1"
                                                                        onClick={() => {
                                                                            if (!statementForm.trim()) return;
                                                                            const newStep: FunctionStepStatement = {
                                                                                id: Date.now().toString(),
                                                                                type: "statement",
                                                                                code: statementForm,
                                                                            };
                                                                            setDesignFunctions((prev) =>
                                                                                prev.map((f) =>
                                                                                    f.id === fn.id
                                                                                        ? {
                                                                                              ...f,
                                                                                              steps: [
                                                                                                  ...(f.steps || []),
                                                                                                  newStep,
                                                                                              ],
                                                                                          }
                                                                                        : f
                                                                                )
                                                                            );
                                                                            setStatementForm("");
                                                                        }}
                                                                    >
                                                                        Add statement
                                                                    </Button>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Write to mapping</Label>
                                                                    <select
                                                                        className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary text-xs"
                                                                        value={mappingForm.mappingId}
                                                                        onChange={(e) =>
                                                                            setMappingForm((prev) => ({
                                                                                ...prev,
                                                                                mappingId: e.target.value,
                                                                            }))
                                                                        }
                                                                    >
                                                                        <option value="">Select mapping</option>
                                                                        {designMappings.map((m, idx) => (
                                                                            <option key={m.id} value={m.id}>
                                                                                mapping{idx + 1} ({(m as any).keyType}{" "}
                                                                                =&gt; {(m as any).valueType})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <Input
                                                                        placeholder="key expression (e.g. msg.sender)"
                                                                        value={mappingForm.keyExpr}
                                                                        onChange={(e) =>
                                                                            setMappingForm((prev) => ({
                                                                                ...prev,
                                                                                keyExpr: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Input
                                                                        placeholder="value expression (e.g. amount)"
                                                                        value={mappingForm.valueExpr}
                                                                        onChange={(e) =>
                                                                            setMappingForm((prev) => ({
                                                                                ...prev,
                                                                                valueExpr: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="mt-1"
                                                                        onClick={() => {
                                                                            if (
                                                                                !mappingForm.mappingId ||
                                                                                !mappingForm.keyExpr.trim() ||
                                                                                !mappingForm.valueExpr.trim()
                                                                            )
                                                                                return;
                                                                            const newStep: FunctionStepMappingSet = {
                                                                                id: Date.now().toString(),
                                                                                type: "setMapping",
                                                                                mappingId: mappingForm.mappingId,
                                                                                keyExpr: mappingForm.keyExpr,
                                                                                valueExpr: mappingForm.valueExpr,
                                                                            };
                                                                            setDesignFunctions((prev) =>
                                                                                prev.map((f) =>
                                                                                    f.id === fn.id
                                                                                        ? {
                                                                                              ...f,
                                                                                              steps: [
                                                                                                  ...(f.steps || []),
                                                                                                  newStep,
                                                                                              ],
                                                                                          }
                                                                                        : f
                                                                                )
                                                                            );
                                                                            setMappingForm({
                                                                                mappingId: "",
                                                                                keyExpr: "",
                                                                                valueExpr: "",
                                                                            });
                                                                        }}
                                                                    >
                                                                        Add mapping write
                                                                    </Button>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">
                                                                        Call another function
                                                                    </Label>
                                                                    <select
                                                                        className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary text-xs"
                                                                        value={callForm.targetFunctionId}
                                                                        onChange={(e) =>
                                                                            setCallForm((prev) => ({
                                                                                ...prev,
                                                                                targetFunctionId: e.target.value,
                                                                            }))
                                                                        }
                                                                    >
                                                                        <option value="">Select function</option>
                                                                        {designFunctions
                                                                            .filter((f) => f.id !== fn.id)
                                                                            .map((f) => (
                                                                                <option key={f.id} value={f.id}>
                                                                                    {f.name}
                                                                                </option>
                                                                            ))}
                                                                    </select>
                                                                    <Input
                                                                        placeholder="arguments, e.g. msg.sender, amount"
                                                                        value={callForm.args}
                                                                        onChange={(e) =>
                                                                            setCallForm((prev) => ({
                                                                                ...prev,
                                                                                args: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Input
                                                                        placeholder="call data (optional, e.g. abi.encode(...))"
                                                                        value={callForm.callData}
                                                                        onChange={(e) =>
                                                                            setCallForm((prev) => ({
                                                                                ...prev,
                                                                                callData: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="mt-1"
                                                                        onClick={() => {
                                                                            if (!callForm.targetFunctionId) return;
                                                                            const newStep: FunctionStepCall = {
                                                                                id: Date.now().toString(),
                                                                                type: "call",
                                                                                targetFunctionId:
                                                                                    callForm.targetFunctionId,
                                                                                args: callForm.args,
                                                                            };
                                                                            setDesignFunctions((prev) =>
                                                                                prev.map((f) =>
                                                                                    f.id === fn.id
                                                                                        ? {
                                                                                              ...f,
                                                                                              steps: [
                                                                                                  ...(f.steps || []),
                                                                                                  newStep,
                                                                                              ],
                                                                                          }
                                                                                        : f
                                                                                )
                                                                            );
                                                                            setCallForm({
                                                                                targetFunctionId: "",
                                                                                args: "",
                                                                                callData: "",
                                                                            });
                                                                        }}
                                                                    >
                                                                        Add function call
                                                                    </Button>
                                                                </div>

                                                                <div className="flex justify-end pt-2">
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setLogicDialogFunctionId(null);
                                                                            toast.success("Function logic saved");
                                                                        }}
                                                                    >
                                                                        Save Function
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Events</CardTitle>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingEventId(null);
                                                setEventForm({ name: "", params: [] });
                                                setIsEventDialogOpen(true);
                                            }}
                                        >
                                            Add Event
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Define custom events your contract can emit.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {designEvents.length === 0 && (
                                        <p className="text-xs text-muted-foreground">No events defined yet.</p>
                                    )}
                                    {designEvents.map((ev) => (
                                        <div
                                            key={ev.id}
                                            className="flex flex-col gap-1 rounded-lg border border-primary/15 bg-card/60 px-3 py-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm text-foreground">
                                                    event {ev.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={() => {
                                                            setEditingEventId(ev.id);
                                                            setEventForm({
                                                                name: ev.name,
                                                                params: ev.params || [],
                                                            });
                                                            setIsEventDialogOpen(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-xs text-destructive"
                                                        onClick={() =>
                                                            setDesignEvents((prev) =>
                                                                prev.filter((event) => event.id !== ev.id)
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                            <code className="text-xs px-2 py-1 rounded bg-muted border border-border overflow-x-auto">
                                                event {ev.name}(
                                                {(ev.params || []).map((p) => `${p.type} ${p.name}`).join(", ")}
                                                );
                                            </code>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <CardTitle>Constructor</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        A Solidity contract can only have one constructor. Configure it here, or remove
                                        it entirely if you don&apos;t need one.
                                    </p>

                                    {designConstructor ? (
                                        <>
                                            <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-xs text-destructive"
                                                    onClick={() => setDesignConstructor(null)}
                                                >
                                                    Remove constructor
                                                </Button>
                                            </div>
                                            <ConstructorEditor
                                                constructor={designConstructor}
                                                onCancel={() => {}}
                                                onSave={(updated) => {
                                                    setDesignConstructor(updated);
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-xs text-muted-foreground">No constructor defined yet.</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setDesignConstructor({
                                                        id: Date.now().toString(),
                                                        parameters: [],
                                                        isPayable: false,
                                                        visibility: "public",
                                                    } as Constructor)
                                                }
                                            >
                                                Add Constructor
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                        <Card className="border-primary/20">
                            <CardHeader>
                                <CardTitle>Project Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="project-name">Project Name</Label>
                                    <Input
                                        id="project-name"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="bg-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="template">Template</Label>
                                    <Input id="template" value={project.template} disabled className="bg-input" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Deployment Status</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="status"
                                            value={project.deploymentStatus}
                                            disabled
                                            className="bg-input"
                                        />
                                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                            {getNetworkLabel(project.deployedNetwork ?? selectedNetwork)}
                                        </Badge>
                                    </div>
                                </div>
                                {project.deployedAddress && (
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Deployed Address</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="address"
                                                value={project.deployedAddress}
                                                disabled
                                                className="bg-input font-mono"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(project.deployedAddress || "");
                                                    toast.success("Address copied", {
                                                        description: "Deployed contract address copied to clipboard.",
                                                    });
                                                }}
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                        {deployedExplorerUrl && (
                                            <Button asChild variant="link" size="sm" className="px-0 h-auto text-sm">
                                                <a href={deployedExplorerUrl} target="_blank" rel="noreferrer">
                                                    View on BaseScan
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {project.deploymentStatus === "deployed" && (
                                    <div className="space-y-2">
                                        <Label>Contract Verification</Label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant={verificationBadgeVariant}
                                                className="text-[10px] px-2 py-0.5"
                                            >
                                                {verificationBadgeLabel}
                                            </Badge>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleVerifyContract}
                                                disabled={
                                                    verifyProject.isPending ||
                                                    verificationStatus === "pending" ||
                                                    !isBaseScanSupported
                                                }
                                                className="text-xs"
                                            >
                                                {verifyProject.isPending ? "Submitting..." : "Verify on BaseScan"}
                                            </Button>
                                            {!isBaseScanSupported && (
                                                <span className="text-xs text-muted-foreground">
                                                    Verification currently supports Base networks.
                                                </span>
                                            )}
                                        </div>
                                        {project.verificationMessage && (
                                            <p className="text-xs text-muted-foreground">
                                                {project.verificationMessage}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {project.abi && Array.isArray(project.abi) && project.abi.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Contract ABI</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                const abiJson = JSON.stringify(project.abi, null, 2);
                                                const blob = new Blob([abiJson], {
                                                    type: "application/json",
                                                });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `${project.name || "contract"}-abi.json`;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                                toast.success("ABI downloaded", {
                                                    description: "Contract ABI has been downloaded successfully.",
                                                });
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download ABI
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Dialog
                            open={isEventDialogOpen}
                            onOpenChange={(open) => {
                                setIsEventDialogOpen(open);
                                if (!open) {
                                    setEditingEventId(null);
                                    setEventForm({ name: "", params: [] });
                                }
                            }}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingEventId ? "Edit Event" : "Add Event"}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="event-name">Event Name</Label>
                                        <Input
                                            id="event-name"
                                            value={eventForm.name}
                                            onChange={(e) =>
                                                setEventForm((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            placeholder="CarMinted"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Parameters</Label>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setEventForm((prev) => ({
                                                        ...prev,
                                                        params: [
                                                            ...prev.params,
                                                            {
                                                                id: Date.now().toString(),
                                                                name: "",
                                                                type: "uint256",
                                                            },
                                                        ],
                                                    }))
                                                }
                                            >
                                                Add param
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {eventForm.params.map((param) => (
                                                <div key={param.id} className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="type (e.g. uint256)"
                                                        value={param.type}
                                                        onChange={(e) =>
                                                            setEventForm((prev) => ({
                                                                ...prev,
                                                                params: prev.params.map((p) =>
                                                                    p.id === param.id
                                                                        ? { ...p, type: e.target.value }
                                                                        : p
                                                                ),
                                                            }))
                                                        }
                                                    />
                                                    <Input
                                                        placeholder="name (e.g. tokenId)"
                                                        value={param.name}
                                                        onChange={(e) =>
                                                            setEventForm((prev) => ({
                                                                ...prev,
                                                                params: prev.params.map((p) =>
                                                                    p.id === param.id
                                                                        ? { ...p, name: e.target.value }
                                                                        : p
                                                                ),
                                                            }))
                                                        }
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive text-xs"
                                                        onClick={() =>
                                                            setEventForm((prev) => ({
                                                                ...prev,
                                                                params: prev.params.filter((p) => p.id !== param.id),
                                                            }))
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            {eventForm.params.length === 0 && (
                                                <p className="text-xs text-muted-foreground">No parameters added.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (!eventForm.name.trim()) return;
                                            const newEvent: DesignEvent = {
                                                id: editingEventId || Date.now().toString(),
                                                name: eventForm.name.trim(),
                                                params: eventForm.params.map((p) => ({
                                                    ...p,
                                                    name: p.name.trim(),
                                                    type: p.type.trim() || "uint256",
                                                })),
                                            };
                                            setDesignEvents((prev) =>
                                                prev.some((ev) => ev.id === newEvent.id)
                                                    ? prev.map((ev) => (ev.id === newEvent.id ? newEvent : ev))
                                                    : [...prev, newEvent]
                                            );
                                            setIsEventDialogOpen(false);
                                        }}
                                    >
                                        Save Event
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
