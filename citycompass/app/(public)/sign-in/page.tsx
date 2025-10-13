"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center p-6 bg-background text-foreground">
      <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
      <p className="text-muted-foreground mb-6">
        Sign in to continue exploring NYC insights
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="email"
          placeholder="Email"
          className="border border-input bg-background rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-input bg-background rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button className="bg-primary text-primary-foreground hover:bg-primary/80">
          Sign In
        </Button>
        <p className="text-sm mt-2 text-muted-foreground">
          Don’t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
