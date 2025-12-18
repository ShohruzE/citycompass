"use server";

import { surveyFormSchema, type SurveyFormData } from "../schemas/survey";

export async function submitSurvey(formData: SurveyFormData) {
  // Nextjs server-side validation
  const validatedFields = surveyFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const data = validatedFields.data;

  try {
    // Get token from localStorage (this needs to be done client-side)
    // Since this is a server action, we need to pass the token from the client
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/survey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to submit survey");
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Error submitting survey:", error);
    return {
      message:
        error instanceof Error
          ? error.message
          : "Failed to submit survey. Please try again.",
    };
  }
}
