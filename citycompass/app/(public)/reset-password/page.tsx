import ResetPasswordContent from "@/app/(protected)/components/ResetPasswordContent";
import { Suspense } from "react";

export default function ResetPassword() {
  return(
      <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    }>

      <ResetPasswordContent />

    </Suspense>
  );
}

