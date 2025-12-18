import { SurveyForm } from "../components/SurveyForm";
import { Suspense } from "react";


export default function SurveyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">City Survey</h1>
        <p className="text-muted-foreground mt-2">Your feedback helps us improve city services for everyone.</p>
      </div>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
            <p>Loading...</p>
          </div>
        }>

        <SurveyForm />

      </Suspense>
    </div>
  );
}