"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      console.log("Attempting to sign in with:", { email: data.email });
      
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setError("Invalid email or password");
        return;
      }

      if (result?.ok) {
        console.log("Sign in successful, redirecting to dashboard");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <AuthForm type="signin" onSubmit={onSubmit} error={error} />
      </div>
    </div>
  );
} 