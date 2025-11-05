import { z } from "zod";

// Step 1: Personal Information
export const personalInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  age: z.number().min(18, "You must be at least 18 years old").max(100, "Age must be less than 100"),
  borough: z.enum(["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"], {
    message: "Please select a borough",
  }),
  neighborhood: z.string().min(2, "Please enter your neighborhood"),
  zipCode: z.string().regex(/^\d{5}$/, "Please enter a valid 5-digit zip code"),
  residencyDuration: z.enum(["< 6 months", "6-12 months", "1-3 years", "3-5 years", "5+ years"], {
    message: "Please select your residency duration",
  }),
});

// Step 2: Safety & Security
export const safetySecuritySchema = z.object({
  safetyRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  timeOfDaySafety: z.enum(["Day only", "Night only", "Both", "Neither"], {
    message: "Please select when you feel safe",
  }),
  crimeConcernLevel: z.enum(["Not concerned", "Slightly concerned", "Moderately concerned", "Very concerned"], {
    message: "Please select your concern level",
  }),
  policePresenceRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  safetyTestimonial: z.string().optional(),
});

// Step 3: Cleanliness & Environment
export const cleanlinessEnvironmentSchema = z.object({
  streetCleanlinessRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  trashManagementRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  parksQualityRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  noiseLevel: z.enum(["Very quiet", "Quiet", "Moderate", "Loud", "Very loud"], {
    message: "Please select the noise level",
  }),
  environmentalTestimonial: z.string().optional(),
});

// Step 4: Food & Amenities
export const foodAmenitiesSchema = z.object({
  groceryStoreAccess: z.enum(["Walk < 5min", "Walk 5-15min", "Walk 15-30min", "Drive required", "No access"], {
    message: "Please select grocery store access",
  }),
  restaurantVarietyRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  foodAffordabilityRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  farmersMarketAccess: z.boolean(),
  foodAccessTestimonial: z.string().optional(),
});

// Step 5: Financials & Living Costs
export const financialsSchema = z.object({
  rentAffordability: z.enum(["Very affordable", "Affordable", "Fair", "Expensive", "Very expensive"], {
    message: "Please select affordability level",
  }),
  costOfLiving: z.enum(["Very low", "Low", "Moderate", "High", "Very high"], {
    message: "Please select cost of living level",
  }),
  valueForMoneyRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  financialTestimonial: z.string().optional(),
});

// ... rest of the file stays the same ...

// Step 6: Overall Feedback
export const overallFeedbackSchema = z.object({
  overallRating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  wouldRecommend: z.boolean(),
  biggestStrength: z.string().min(10, "Please provide at least 10 characters"),
  areaForImprovement: z.string().min(10, "Please provide at least 10 characters"),
  additionalComments: z.string().optional(),
});

// Complete survey form schema
export const surveyFormSchema = personalInfoSchema
  .merge(safetySecuritySchema)
  .merge(cleanlinessEnvironmentSchema)
  .merge(foodAmenitiesSchema)
  .merge(financialsSchema)
  .merge(overallFeedbackSchema);

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type SafetySecurityData = z.infer<typeof safetySecuritySchema>;
export type CleanlinessEnvironmentData = z.infer<typeof cleanlinessEnvironmentSchema>;
export type FoodAmenitiesData = z.infer<typeof foodAmenitiesSchema>;
export type FinancialsData = z.infer<typeof financialsSchema>;
export type OverallFeedbackData = z.infer<typeof overallFeedbackSchema>;
export type SurveyFormData = z.infer<typeof surveyFormSchema>;
