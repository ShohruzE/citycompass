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
    // Send the complete survey data to the FastAPI backend
    const response = await fetch(`${process.env.API_BASE_URL}/api/survey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to submit survey");
    }
    // revalidatePath("/survey");
  } catch (error) {
    console.error("Error submitting survey:", error);
    return {
      message: "Failed to submit survey. Please try again.",
    };
  }
}
