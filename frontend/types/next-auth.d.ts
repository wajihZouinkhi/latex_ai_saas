import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
      emailVerified: boolean;
      token: string;
      githubConnected: boolean;
      // GitHub data
      githubId?: string;
      githubUsername?: string;
      githubName?: string;
      githubEmail?: string;
      githubAvatarUrl?: string;
      githubRepos?: number;
      githubFollowers?: number;
      githubFollowing?: number;
      githubAccessToken?: string;
      githubRefreshToken?: string;
      githubTokenExpiresAt?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    emailVerified: boolean;
    token: string;
    githubConnected: boolean;
    // GitHub data
    githubId?: string;
    githubUsername?: string;
    githubName?: string;
    githubEmail?: string;
    githubAvatarUrl?: string;
    githubRepos?: number;
    githubFollowers?: number;
    githubFollowing?: number;
    githubAccessToken?: string;
    githubRefreshToken?: string;
    githubTokenExpiresAt?: string;
  }
} 