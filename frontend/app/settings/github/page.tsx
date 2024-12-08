"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Users, GitFork, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { useState, useEffect } from "react";
import Image from "next/image";

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function GitHubSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleSessionUpdate = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      const newToken = searchParams.get('token');
      
      if (success === 'true' && newToken) {
        setIsUpdating(true);
        try {
          // Update session with new token and GitHub data
          await updateSession({
            user: {
              ...session?.user,
              token: newToken,
              githubConnected: true,
              githubUsername: searchParams.get('githubUsername') || undefined,
              githubAvatarUrl: searchParams.get('githubAvatarUrl') || undefined,
              githubName: searchParams.get('githubName') || undefined,
              githubEmail: searchParams.get('githubEmail') || undefined,
              githubRepos: parseInt(searchParams.get('publicRepos') || '0'),
              githubFollowers: parseInt(searchParams.get('followers') || '0'),
              githubFollowing: parseInt(searchParams.get('following') || '0'),
            }
          });

          setStatus('success');
          setMessage(`Successfully connected GitHub account${searchParams.get('githubUsername') ? ` for @${searchParams.get('githubUsername')}` : ''}`);
        } catch (error) {
          console.error('Failed to update session:', error);
          setStatus('error');
          setMessage('Failed to update session with GitHub data');
        } finally {
          setIsUpdating(false);
          // Remove query params
          router.replace('/settings/github');
        }
      } else if (error) {
        setStatus('error');
        setMessage(decodeURIComponent(error));
      }
    };

    handleSessionUpdate();
  }, [searchParams, session?.user, updateSession, router]);

  const handleConnectGitHub = async () => {
    if (!session?.user?.token) {
      setStatus('error');
      setMessage('Please sign in to connect your GitHub account');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${baseURL}/github/auth/url`, {
        headers: {
          'Authorization': `Bearer ${session.user.token}`
        }
      });
      const { url } = response.data.data;
      window.location.href = url;
    } catch (error: any) {
      console.error("Failed to get GitHub auth URL:", error);
      setStatus('error');
      if (error.message === 'UNAUTHORIZED') {
        setMessage('Please sign in to connect your GitHub account');
      } else {
        setMessage(error.response?.data?.message || 'Failed to initiate GitHub connection');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>
            Connect your GitHub account to access and manage your repositories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status && (
            <Alert variant={status === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {isUpdating && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Updating GitHub connection...</span>
            </div>
          )}

          <div className="flex items-start gap-4">
            {session?.user?.githubAvatarUrl && (
              <div className="relative h-16 w-16 rounded-full overflow-hidden">
                <Image
                  src={session.user.githubAvatarUrl}
                  alt={`${session.user.githubName || session.user.githubUsername}'s avatar`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  {session?.user?.githubConnected
                    ? session.user.githubName || session.user.githubUsername
                    : "Not Connected"}
                </h3>
              </div>
              {session?.user?.githubConnected && (
                <>
                  <p className="text-sm text-muted-foreground mt-1">
                    @{session.user.githubUsername}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      {session.user.githubRepos} repositories
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {session.user.githubFollowers} followers · {session.user.githubFollowing} following
                    </div>
                  </div>
                </>
              )}
              {!session?.user?.githubConnected && (
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your GitHub account to get started
                </p>
              )}
            </div>
            <Button
              variant={session?.user?.githubConnected ? "outline" : "default"}
              onClick={handleConnectGitHub}
              disabled={isLoading || isUpdating}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                session?.user?.githubConnected ? "Reconnect" : "Connect"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
