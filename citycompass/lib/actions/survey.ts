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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/survey`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      const detail =
        typeof err?.detail === "string"
          ? err.detail
          : Array.isArray(err?.detail)
          ? `Validation error: ${err.detail
              .map((e: any) => {
                const loc = Array.isArray(e?.loc)
                  ? e.loc[e.loc.length - 1]
                  : e?.loc;
                const msg = e?.msg || e?.message || "Invalid";
                return `${loc}: ${msg}`;
              })
              .join("; ")}`
          : typeof err?.message === "string"
          ? err.message
          : typeof err?.detail?.detail === "string"
          ? err.detail.detail
          : `HTTP error! status: ${response.status}`;
      throw new Error(detail);
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
