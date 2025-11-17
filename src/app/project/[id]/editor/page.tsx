"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  StructEditor,
  MappingEditor,
  ConstructorEditor,
} from "@/components/contract-editor";
import type { Struct, Mapping, Constructor } from "@/schemas/contract.schema";
import {
  useProject,
  useUpdateProject,
  useDeployProject,
} from "@/hooks/use-projects";
import { CONTRACT_TEMPLATES } from "@/lib/contract-templates";
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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

type DesignFunction = {
  id: string;
  name: string;
  visibility: "public" | "private" | "internal" | "external";
  stateMutability?: "view" | "pure" | "payable" | "nonpayable" | "constant";
  inputs: ParsedFunctionParam[];
  outputs?: string;
};

function buildDesignSection(
  structs: Struct[],
  mappings: Mapping[],
  functions: DesignFunction[],
  ctor: Constructor | null
): string | null {
  const lines: string[] = [];

  if (
    structs.length === 0 &&
    mappings.length === 0 &&
    functions.length === 0 &&
    !ctor
  ) {
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
      const varName = `mapping${index + 1}`;
      lines.push(`mapping(${keyType} => ${valueType}) public ${varName};`);
    });
    lines.push("");
  }

  if (ctor) {
    lines.push("// Constructor generated from designer");
    const params = (ctor.parameters || [])
      .map((p) => `${p.type} ${p.name}`)
      .join(", ");
    const visibility = ctor.visibility || "public";
    const payable = ctor.isPayable ? "payable " : "";
    lines.push(`constructor(${params}) ${visibility} ${payable}{`);
    lines.push("    // TODO: add constructor logic");
    lines.push("}");
    lines.push("");
  }

  if (functions.length > 0) {
    lines.push("// Functions generated from designer");
    for (const fn of functions) {
      const params = fn.inputs.map((p) => `${p.type} ${p.name}`).join(", ");
      const visibility = fn.visibility || "public";
      const mutability = fn.stateMutability ? ` ${fn.stateMutability}` : "";
      const returns = fn.outputs ? ` returns (${fn.outputs})` : "";
      lines.push(
        `function ${fn.name}(${params}) ${visibility}${mutability}${returns} {`
      );
      lines.push("    // TODO: add function logic");
      lines.push("}");
      lines.push("");
    }
  }

  lines.push("// === SMARTFORGE DESIGN END ===");

  return lines.join("\n");
}

function applyDesignSectionToCode(
  code: string,
  section: string | null
): string {
  const startMarker = "// === SMARTFORGE DESIGN START ===";
  const endMarker = "// === SMARTFORGE DESIGN END ===";

  const startIndex = code.indexOf(startMarker);

  if (!section) {
    if (startIndex === -1) return code;
    const endIndex = code.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
      return code.slice(0, startIndex);
    }
    const afterEnd = code.indexOf("\n", endIndex + endMarker.length);
    return (
      code.slice(0, startIndex) +
      (afterEnd !== -1 ? code.slice(afterEnd + 1) : "")
    );
  }

  if (startIndex === -1) {
    const sep = code.endsWith("\n") ? "" : "\n";
    return code + sep + "\n" + section + "\n";
  }

  const endIndex = code.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    return code.slice(0, startIndex) + section + "\n";
  }
  const afterEnd = code.indexOf("\n", endIndex + endMarker.length);
  const tail = afterEnd !== -1 ? code.slice(afterEnd + 1) : "";
  return code.slice(0, startIndex) + section + "\n" + tail;
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
      const fieldMatch = /^([a-zA-Z0-9_\[\]]+)\s+([a-zA-Z0-9_]+)\s*;/.exec(
        line
      );
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
  const mappingRegex =
    /mapping\s*\(\s*([^)]+?)\s*=>\s*([^)]+?)\s*\)\s*([a-zA-Z0-9_]+)\s*;/g;
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

  const [sourceCode, setSourceCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState("");

  const [variables, setVariables] = useState<DesignVariable[]>([]);
  const [designStructs, setDesignStructs] = useState<Struct[]>([]);
  const [designMappings, setDesignMappings] = useState<Mapping[]>([]);
  const [designFunctions, setDesignFunctions] = useState<DesignFunction[]>([]);
  const [designConstructor, setDesignConstructor] =
    useState<Constructor | null>(null);

  const [editingStruct, setEditingStruct] = useState<Struct | null>(null);
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);

  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(
    null
  );
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
  const [editingFunctionId, setEditingFunctionId] = useState<string | null>(
    null
  );
  const [functionForm, setFunctionForm] = useState<{
    name: string;
  }>({
    name: "",
  });

  const parsedStructs = useMemo(
    () => (sourceCode ? parseStructs(sourceCode) : []),
    [sourceCode]
  );

  const parsedMappings = useMemo(
    () => (sourceCode ? parseMappings(sourceCode) : []),
    [sourceCode]
  );

  const parsedFunctions = useMemo(
    () => (sourceCode ? parseFunctions(sourceCode) : []),
    [sourceCode]
  );

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setSourceCode(
        project.sourceCode ||
          CONTRACT_TEMPLATES[project.template] ||
          CONTRACT_TEMPLATES.Custom
      );

      const metadata = (project.metadata || {}) as any;
      const design = metadata.design || {};
      setVariables(design.variables || []);
      setDesignStructs(design.structs || []);
      setDesignMappings(design.mappings || []);
      setDesignFunctions(design.functions || []);
      setDesignConstructor(design.constructor || null);
    }
  }, [project]);

  useEffect(() => {
    setSourceCode((prev) =>
      applyDesignSectionToCode(
        prev,
        buildDesignSection(
          designStructs,
          designMappings,
          designFunctions,
          designConstructor
        )
      )
    );
  }, [designStructs, designMappings, designFunctions, designConstructor]);

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

  const handleDeploy = async () => {
    if (!project) return;

    try {
      await deployProject.mutateAsync(project._id);
      toast.success("Deployment Started", {
        description:
          "Your contract is being deployed with gasless transactions.",
      });
    } catch (error) {
      toast.error("Deployment Failed", {
        description: "Failed to deploy contract. Please try again.",
      });
    }
  };

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
                <h1 className="text-2xl font-bold text-foreground">
                  {project.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {project.template} Contract
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={deployProject.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {deployProject.isPending ? "Deploying..." : "Deploy Contract"}
              </Button>
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
                <CardTitle>Solidity Code</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="font-mono text-sm min-h-[600px] bg-background border-primary/20"
                  placeholder="// Your Solidity code here..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variables" className="mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>State Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Design your state variables here. They are stored in the
                    project metadata and can later be used to generate Solidity
                    code.
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
                            setVariables((prev) =>
                              prev.filter((v) => v.id !== variable.id)
                            )
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {variables.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No variables defined yet.
                    </p>
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

                <Dialog
                  open={isVariableDialogOpen}
                  onOpenChange={setIsVariableDialogOpen}
                >
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
                              visibility: e.target
                                .value as DesignVariable["visibility"],
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
                      <Button
                        variant="outline"
                        onClick={() => setIsVariableDialogOpen(false)}
                      >
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
                                const openBraceIndex = prev.indexOf(
                                  "{",
                                  contractIndex
                                );
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
                      Design your mappings here. They are stored in project
                      metadata and can later be used to generate Solidity code.
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
                          <span className="font-medium text-sm text-foreground">
                            mapping
                          </span>
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
                      </div>
                    ))}
                    {designMappings.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No mappings defined yet.
                      </p>
                    )}
                  </div>

                  {editingMapping && (
                    <MappingEditor
                      mapping={editingMapping}
                      onCancel={() => setEditingMapping(null)}
                      onSave={(updated) => {
                        setDesignMappings((prev) =>
                          prev.some((m) => m.id === updated.id)
                            ? prev.map((m) =>
                                m.id === updated.id ? updated : m
                              )
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
                      Design your structs here. They are stored in project
                      metadata and can later be used to generate Solidity code.
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
                      <p className="text-xs text-muted-foreground">
                        No structs defined yet.
                      </p>
                    )}
                  </div>

                  {editingStruct && (
                    <StructEditor
                      struct={editingStruct}
                      onCancel={() => setEditingStruct(null)}
                      onSave={(updated) => {
                        setDesignStructs((prev) =>
                          prev.some((s) => s.id === updated.id)
                            ? prev.map((s) =>
                                s.id === updated.id ? updated : s
                              )
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
                        Track your contract functions here. They are stored in
                        project metadata and used to generate Solidity stubs.
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
                          `(${fn.inputs
                            .map((p) => `${p.type} ${p.name}`)
                            .join(", ")})`,
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

                    <Dialog
                      open={isFunctionDialogOpen}
                      onOpenChange={setIsFunctionDialogOpen}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingFunctionId
                              ? "Edit Function"
                              : "Add Function"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fn-name">Name</Label>
                            <Input
                              id="fn-name"
                              value={functionForm.name}
                              onChange={(e) =>
                                setFunctionForm({ name: e.target.value })
                              }
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
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Constructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConstructorEditor
                    constructor={designConstructor || undefined}
                    onCancel={() => {}}
                    onSave={(updated) => {
                      setDesignConstructor(updated);
                    }}
                  />
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
                  <Input
                    id="template"
                    value={project.template}
                    disabled
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Deployment Status</Label>
                  <Input
                    id="status"
                    value={project.deploymentStatus}
                    disabled
                    className="bg-input"
                  />
                </div>
                {project.deployedAddress && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Deployed Address</Label>
                    <Input
                      id="address"
                      value={project.deployedAddress}
                      disabled
                      className="bg-input font-mono"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
