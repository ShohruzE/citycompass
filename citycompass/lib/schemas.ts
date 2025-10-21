import { z } from "zod";

export const surveyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  age: z.number().min(18, "You must be at least 18 years old").max(100, "Age must be less than 100"),
  city: z.string().min(2, "Please enter your city"),
  feedback: z.string().min(10, "Feedback must be at least 10 characters"),
  rating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
});

export type SurveyFormData = z.infer<typeof surveyFormSchema>;
