"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GitFork, Star, Search, ArrowLeft, Code, ExternalLink } from "lucide-react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  visibility: string;
  owner: string;
  updated_at: string;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingRepo, setCreatingRepo] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!session?.user?.token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get<ApiResponse<{ repositories: Repository[] }>>('/github/repositories');
        if (response.data.success) {
          const repos = response.data.data?.repositories || [];
          setRepositories(repos);
          setFilteredRepos(repos);
        } else {
          setError(response.data.message || "Failed to load repositories");
        }
      } catch (error: any) {
        console.error("Failed to fetch repositories:", error);
        setError(error.response?.data?.message || "Failed to load repositories. Please make sure your GitHub account is connected.");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.token) {
      fetchRepositories();
    }
  }, [session?.user?.token]);

  useEffect(() => {
    const filtered = repositories.filter(repo => 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRepos(filtered);
  }, [searchQuery, repositories]);

  const pollProjectStatus = async (projectId: string) => {
    try {
      const response = await axiosInstance.get<ApiResponse<{ status: string; isAccessible: boolean; error?: string }>>(
        `/projects/${projectId}/status`
      );
      
      if (response.data.success) {
        const { status, isAccessible, error } = response.data.data!;
        
        if (isAccessible) {
          toast({
            title: "Success",
            description: "Project created successfully!",
          });
          router.push(`/projects/${projectId}`);
        } else if (status === 'FAILED') {
          toast({
            title: "Project Creation Failed",
            description: error || "Failed to import repository. Please try again.",
            variant: "destructive",
          });
          setCreatingRepo(null);
        } else {
          // Still pending, update toast and poll again
          toast({
            title: "Creating Project",
            description: "Importing repository content... This may take a few moments.",
          });
          setTimeout(() => pollProjectStatus(projectId), 2000);
        }
      }
    } catch (error: any) {
      console.error("Failed to check project status:", error);
      toast({
        title: "Error",
        description: "Failed to check project status. Please check the dashboard.",
        variant: "destructive",
      });
      setCreatingRepo(null);
    }
  };

  const handleCreateProject = async (repo: Repository) => {
    if (!session?.user?.token) return;

    setCreatingRepo(repo.id);
    try {
      const response = await axiosInstance.post<ApiResponse<{ project: { id: string; status: string } }>>(
        `/projects/create/from-repository/${repo.id}`
      );
      
      if (response.data.success) {
        const { id, status } = response.data.data!.project;
        toast({
          title: "Project Creation Started",
          description: "Starting repository import...",
        });
        // Start polling for project status
        pollProjectStatus(id);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to create project",
          variant: "destructive",
        });
        setCreatingRepo(null);
      }
    } catch (error: any) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create project",
        variant: "destructive",
      });
      setCreatingRepo(null);
    }
  };

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Project</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Select a repository to create a new documentation project
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-6">
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : filteredRepos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery ? "No repositories found matching your search" : "No repositories found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRepos.map((repo) => (
            <Card key={repo.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold truncate">{repo.name}</h3>
                      <span className="flex-none text-xs px-2 py-1 rounded-full bg-muted">
                        {repo.visibility}
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        <span>{repo.owner}/{repo.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        <span>{repo.default_branch}</span>
                      </div>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
                      >
                        <span className="hidden sm:inline">View on GitHub</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div className="flex sm:flex-col justify-end gap-2 sm:gap-0">
                    <Button
                      onClick={() => handleCreateProject(repo)}
                      disabled={creatingRepo !== null}
                      className="w-full relative"
                    >
                      {creatingRepo === repo.id ? (
                        <>
                          <span className="opacity-0">Creating...</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          </div>
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 