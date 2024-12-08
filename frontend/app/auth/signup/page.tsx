"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import axiosInstance from "@/lib/axios";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();

  const onSubmit = async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      await axiosInstance.post("/auth/signup", data);
      router.push("/auth/signin?registered=true");
    } catch (error: any) {
      if (error.response?.data?.errors?.user) {
        setError(error.response.data.errors.user);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <AuthForm type="signup" onSubmit={onSubmit} error={error} />
      </div>
    </div>
  );
} 