import SigninContent from "@/app/(protected)/components/SigninContent";
import { Suspense } from "react";


export default function SignInPage() {
  return(
    <Suspense fallback={
          <div className="flex justify-center items-center min-h-screen">
            <p>Loading...</p>
          </div>
    }>

    <SigninContent />

    </Suspense>
  );
}