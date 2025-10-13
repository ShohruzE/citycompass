"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center p-6 bg-background text-foreground">
      <h2 className="text-3xl font-bold mb-4">Create an Account</h2>
      <p className="text-muted-foreground mb-6">
        Join CityCompass to explore data-driven insights about NYC neighborhoods.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="text"
          placeholder="Full Name"
          className="border border-input bg-background rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
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
          Create Account
        </Button>
        <p className="text-sm mt-2 text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
