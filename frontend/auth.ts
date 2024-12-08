import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Define custom User type
interface User {
  id: string;
  email: string;
  name: string;
  token: string;
  isAdmin: boolean;
  emailVerified: boolean;
  githubConnected: boolean;
  githubUsername?: string;
  githubAvatarUrl?: string;
  githubName?: string;
  githubEmail?: string;
  githubRepos?: number;
  githubFollowers?: number;
  githubFollowing?: number;
  image?: string;
}

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    user: User;
  }
}

export const { auth, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const response = await axios.post(`${baseURL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          if (response.data.success) {
            const userData = response.data.data;
            return {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              token: userData.token,
              isAdmin: userData.isAdmin || false,
              emailVerified: userData.emailVerified || false,
              githubConnected: userData.githubConnected || false,
              githubUsername: userData.githubUsername,
              githubAvatarUrl: userData.githubAvatarUrl,
              githubName: userData.githubName,
              githubEmail: userData.githubEmail,
              githubRepos: userData.publicRepos,
              githubFollowers: userData.followers,
              githubFollowing: userData.following,
              image: userData.avatarUrl,
            } as User;
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        // Update token with new session data
        return {
          ...token,
          ...session.user
        };
      }
      
      if (user) {
        // Initial sign in
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.token = user.token;
        token.isAdmin = user.isAdmin;
        token.emailVerified = user.emailVerified;
        token.githubConnected = user.githubConnected;
        token.githubUsername = user.githubUsername;
        token.githubAvatarUrl = user.githubAvatarUrl;
        token.githubName = user.githubName;
        token.githubEmail = user.githubEmail;
        token.githubRepos = user.githubRepos;
        token.githubFollowers = user.githubFollowers;
        token.githubFollowing = user.githubFollowing;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          token: token.token as string,
          isAdmin: token.isAdmin as boolean,
          emailVerified: token.emailVerified as boolean,
          githubConnected: token.githubConnected as boolean,
          githubUsername: token.githubUsername as string | undefined,
          githubAvatarUrl: token.githubAvatarUrl as string | undefined,
          githubName: token.githubName as string | undefined,
          githubEmail: token.githubEmail as string | undefined,
          githubRepos: token.githubRepos as number | undefined,
          githubFollowers: token.githubFollowers as number | undefined,
          githubFollowing: token.githubFollowing as number | undefined,
          image: token.image as string | undefined,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}); 