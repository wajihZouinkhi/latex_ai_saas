"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GitFork, Calendar, ExternalLink, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string;
  repositoryName: string;
  repositoryUrl: string;
  documentTitle: string;
  status: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axiosInstance.get('/projects');
        if (response.data.success) {
          setProjects(response.data.data.projects || []);
        } else {
          setError(response.data.message || "Failed to load projects");
        }
      } catch (error: any) {
        console.error("Failed to fetch projects:", error);
        setError(error.response?.data?.message || "Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProjects();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  if (!session?.user) {
    return (
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Please Sign In</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Sign in to view your dashboard and manage your projects
            </p>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Your Projects</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage your documentation projects and create new ones
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/projects/new" className="flex items-center justify-center">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
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
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center px-4">
              Create your first project by clicking the button above
            </p>
            <Button asChild>
              <Link href="/projects/new" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="flex-none">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate text-base sm:text-lg">
                    {project.name || project.repositoryName}
                  </span>
                  <span className="flex-none text-xs px-2 py-1 rounded-full bg-muted">
                    {project.status}
                  </span>
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {project.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <GitFork className="mr-2 h-4 w-4" />
                    <span className="truncate flex-1">{project.repositoryName}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4 flex-none" />
                    <span className="truncate">
                      Last updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/projects/${project.id}`}>View Project</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 