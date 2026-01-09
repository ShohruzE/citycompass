"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function SignUpPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string) || "http://localhost:8000";

  const handleGoogleSignUp = () => {
    try {
      setErrorMessage("");

      // const backendURL = {process.env.BACKEND_URL};
      // const backendURL = "http://127.0.0.1:8000";
      window.location.href = `${API_BASE}/api/auth/google-login`;
    } catch {
      setErrorMessage("failed to initiate Google Sign in");
    }
  };

  const handleMicrosoftSignUp = () => {
    try {
      setErrorMessage("");

      // OAuth flow: Backend handles redirect after authentication
      window.location.href = `${API_BASE}/api/auth/ms-login`;
    } catch {
      setErrorMessage("failed to initiate Microsoft Sign in");
    }
  };

  const handleEmailSignup = async (formData: FormData) => {
    try {
      const email = formData.get("email");
      const password = formData.get("password");

      setErrorMessage("");


      const response = await fetch(`${API_BASE}/api/auth/register`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        // Handle HTTP errors (4xx, 5xx)
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      setSignUpSuccess(true);

      // Automatically log in the user after successful signup
      const loginResponse = await fetch(`${API_BASE}/api/auth/email-auth`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem("token", loginData.token);

        // New users always go to survey (has_survey will be false)
        setTimeout(() => {
          window.location.href = "/survey";
        }, 1500);
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign in with email");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] text-center px-6 pt-8 pb-8 bg-background text-foreground">
      <h2 className="text-3xl font-bold mb-4">Create an Account</h2>
      <p className="text-muted-foreground mb-6">
        Join CityCompass to explore data-driven insights about NYC neighborhoods.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <form className="flex flex-col gap-3 w-full max-w-sm" action={handleEmailSignup}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="border border-input bg-background rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="border border-input bg-background rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80">
            Create Account
          </Button>
        </form>

        {signUpSuccess && (
          <div className="w-full max-w-sm p-6 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 font-semibold mb-4">Sign up successful!</p>
            <Link href="/sign-in">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/80">Go to Sign In</Button>
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <button
          onClick={handleGoogleSignUp}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
              fill="#4285F4"
            />
            <path
              d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
              fill="#34A853"
            />
            <path
              d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
              fill="#FBBC05"
            />
            <path
              d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.737 7.395 3.977 10 3.977z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-gray-700 font-medium">Create account with Google</span>
        </button>

        <button
          onClick={handleMicrosoftSignUp}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h9.524v9.524H0V0z" fill="#F25022" />
            <path d="M10.476 0H20v9.524h-9.524V0z" fill="#7FBA00" />
            <path d="M0 10.476h9.524V20H0v-9.524z" fill="#00A4EF" />
            <path d="M10.476 10.476H20V20h-9.524v-9.524z" fill="#FFB900" />
          </svg>
          <span className="text-gray-700 font-medium">Create account with Microsoft</span>
        </button>

        <p className="text-sm mt-2 text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>

        {errorMessage && <p className="text-md mt-2 text-red-500">{errorMessage}</p>}
      </div>
    </div>
  );
}
