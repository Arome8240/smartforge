"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "@/hooks/use-toast";

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

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (project) {
      setSourceCode(
        project.sourceCode ||
          CONTRACT_TEMPLATES[project.template] ||
          CONTRACT_TEMPLATES.Custom
      );
    }
  }, [project]);

  const handleSave = async () => {
    if (!project) return;

    setIsSaving(true);
    try {
      await updateProject.mutateAsync({
        id: project.id,
        sourceCode,
      });
      toast({
        title: "Saved",
        description: "Contract code has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contract code.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (!project) return;

    try {
      await deployProject.mutateAsync(project.id);
      toast({
        title: "Deployment Started",
        description:
          "Your contract is being deployed with gasless transactions.",
      });
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy contract. Please try again.",
        variant: "destructive",
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
              <CardContent>
                <p className="text-muted-foreground">
                  Variable editor coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mappings" className="mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Mappings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Mapping editor coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structs" className="mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Structs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Struct editor coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions" className="mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Function editor coming soon...
                </p>
              </CardContent>
            </Card>
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
                    value={project.name}
                    disabled
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
