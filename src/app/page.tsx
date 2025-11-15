"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { ProjectTemplate } from "@/schemas/project.schema";
import { Plus, Code2, FileCode, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { ready, authenticated, user, login } = usePrivy();
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [template, setTemplate] = useState<ProjectTemplate>("Custom");

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !user?.wallet?.address) return;

    try {
      const newProject = await createProject.mutateAsync({
        name: projectName,
        template,
        owner: user.wallet.address,
        sourceCode: "",
      });
      setIsModalOpen(false);
      setProjectName("");
      router.push(`/project/${newProject.id}/editor`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const templateIcons = {
    ERC20: FileCode,
    ERC721: Sparkles,
    Custom: Code2,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              My Projects
            </h1>
            <p className="text-muted-foreground">
              Create and manage your smart contracts
            </p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Choose a template to get started with your smart contract.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Contract"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={template}
                    onValueChange={(value) =>
                      setTemplate(value as ProjectTemplate)
                    }
                  >
                    <SelectTrigger id="template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC20">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4" />
                          ERC20 Token
                        </div>
                      </SelectItem>
                      <SelectItem value="ERC721">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          ERC721 NFT
                        </div>
                      </SelectItem>
                      <SelectItem value="Custom">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4" />
                          Custom Contract
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || createProject.isPending}
                  className="bg-primary text-primary-foreground"
                >
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-primary/20">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const Icon = templateIcons[project.template];
              return (
                <Link key={project.id} href={`/project/${project.id}/editor`}>
                  <Card className="border-primary/20 bg-card/50 hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-foreground">
                              {project.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {project.template}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              project.deploymentStatus === "deployed"
                                ? "bg-green-500/20 text-green-400"
                                : project.deploymentStatus === "deploying"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {project.deploymentStatus}
                          </span>
                        </div>
                        {project.deployedAddress && (
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {project.deployedAddress}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-primary/20 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Code2 className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No projects yet
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Get started by creating your first smart contract project
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
