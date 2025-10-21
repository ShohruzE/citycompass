import { SurveyForm } from "../components/SurveyForm";


export default function SurveyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">City Survey</h1>
        <p className="text-muted-foreground mt-2">Your feedback helps us improve city services for everyone.</p>
      </div>

      <SurveyForm />
    </div>
  );
}