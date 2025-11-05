"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { surveyFormSchema, type SurveyFormData } from "@/lib/schemas/survey";
import { submitSurvey } from "@/lib/actions/survey";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "citycompass-survey-draft";

const STEPS = [
  { title: "Personal Info", description: "Tell us about yourself" },
  { title: "Safety & Security", description: "How safe do you feel?" },
  { title: "Cleanliness", description: "Rate your environment" },
  { title: "Food & Amenities", description: "Access to essentials" },
  { title: "Financials", description: "Cost of living" },
  { title: "Overall Feedback", description: "Final thoughts" },
];

export function SurveyForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedData, setSavedData, clearSavedData] = useLocalStorage<Partial<SurveyFormData>>(STORAGE_KEY, {});

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      age: 18,
      borough: undefined,
      neighborhood: "",
      zipCode: "",
      residencyDuration: undefined,
      safetyRating: 3,
      timeOfDaySafety: undefined,
      crimeConcernLevel: undefined,
      policePresenceRating: 3,
      safetyTestimonial: "",
      streetCleanlinessRating: 3,
      trashManagementRating: 3,
      parksQualityRating: 3,
      noiseLevel: undefined,
      environmentalTestimonial: "",
      groceryStoreAccess: undefined,
      restaurantVarietyRating: 3,
      foodAffordabilityRating: 3,
      farmersMarketAccess: false,
      foodAccessTestimonial: "",
      rentAffordability: undefined,
      costOfLiving: undefined,
      valueForMoneyRating: 3,
      financialTestimonial: "",
      overallRating: 3,
      wouldRecommend: false,
      biggestStrength: "",
      areaForImprovement: "",
      additionalComments: "",
    },
  });

  // Load saved data on mount
  useEffect(() => {
    if (Object.keys(savedData).length > 0) {
      Object.entries(savedData).forEach(([key, value]) => {
        form.setValue(key as keyof SurveyFormData, value as SurveyFormData[keyof SurveyFormData]);
      });
    }
  }, [savedData, form]);

  // Save form data to localStorage on any change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setSavedData(value as Partial<SurveyFormData>);
    });
    return () => subscription.unsubscribe();
  }, [form, setSavedData]);

  const validateStep = async () => {
    let isValid = false;

    switch (currentStep) {
      case 0:
        isValid = await form.trigger([
          "name",
          "email",
          "age",
          "borough",
          "neighborhood",
          "zipCode",
          "residencyDuration",
        ]);
        break;
      case 1:
        isValid = await form.trigger([
          "safetyRating",
          "timeOfDaySafety",
          "crimeConcernLevel",
          "policePresenceRating",
          "safetyTestimonial",
        ]);
        break;
      case 2:
        isValid = await form.trigger([
          "streetCleanlinessRating",
          "trashManagementRating",
          "parksQualityRating",
          "noiseLevel",
          "environmentalTestimonial",
        ]);
        break;
      case 3:
        isValid = await form.trigger([
          "groceryStoreAccess",
          "restaurantVarietyRating",
          "foodAffordabilityRating",
          "farmersMarketAccess",
          "foodAccessTestimonial",
        ]);
        break;
      case 4:
        isValid = await form.trigger([
          "rentAffordability",
          "costOfLiving",
          "valueForMoneyRating",
          "financialTestimonial",
        ]);
        break;
      case 5:
        isValid = await form.trigger([
          "overallRating",
          "wouldRecommend",
          "biggestStrength",
          "areaForImprovement",
          "additionalComments",
        ]);
        break;
    }

    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (data: SurveyFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await submitSurvey(data);

      if (result?.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
          if (errors) {
            form.setError(field as keyof SurveyFormData, {
              type: "server",
              message: errors[0],
            });
          }
        });
      } else if (result?.message) {
        setServerError(result.message);
      } else {
        // Success - clear saved data
        clearSavedData();
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>NYC Neighborhood Survey</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
          <div className="pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                {serverError}
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="borough"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Borough *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select borough" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Manhattan">Manhattan</SelectItem>
                            <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                            <SelectItem value="Queens">Queens</SelectItem>
                            <SelectItem value="Bronx">Bronx</SelectItem>
                            <SelectItem value="Staten Island">Staten Island</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neighborhood *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Williamsburg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="residencyDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How long have you lived in this neighborhood? *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="< 6 months">Less than 6 months</SelectItem>
                          <SelectItem value="6-12 months">6-12 months</SelectItem>
                          <SelectItem value="1-3 years">1-3 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="5+ years">5+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Safety & Security */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-semibold">Safety & Security</h3>

                <FormField
                  control={form.control}
                  name="safetyRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Safety Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Unsafe</SelectItem>
                            <SelectItem value="2">2 - Unsafe</SelectItem>
                            <SelectItem value="3">3 - Neutral</SelectItem>
                            <SelectItem value="4">4 - Safe</SelectItem>
                            <SelectItem value="5">5 - Very Safe</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeOfDaySafety"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>When do you feel safe in your neighborhood? *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Day only" id="day" />
                            <Label htmlFor="day" className="font-normal cursor-pointer">
                              Day only
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Night only" id="night" />
                            <Label htmlFor="night" className="font-normal cursor-pointer">
                              Night only
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Both" id="both" />
                            <Label htmlFor="both" className="font-normal cursor-pointer">
                              Both day and night
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Neither" id="neither" />
                            <Label htmlFor="neither" className="font-normal cursor-pointer">
                              Neither
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="crimeConcernLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How concerned are you about crime? *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select concern level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Not concerned">Not concerned</SelectItem>
                          <SelectItem value="Slightly concerned">Slightly concerned</SelectItem>
                          <SelectItem value="Moderately concerned">Moderately concerned</SelectItem>
                          <SelectItem value="Very concerned">Very concerned</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="policePresenceRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Police Presence Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Inadequate</SelectItem>
                            <SelectItem value="2">2 - Below Average</SelectItem>
                            <SelectItem value="3">3 - Adequate</SelectItem>
                            <SelectItem value="4">4 - Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="safetyTestimonial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safety Testimonial (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your experience about safety in your neighborhood..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your testimonial may be used to help others understand safety in this area.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Cleanliness & Environment */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-semibold">Cleanliness & Environment</h3>

                <FormField
                  control={form.control}
                  name="streetCleanlinessRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Cleanliness Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Dirty</SelectItem>
                            <SelectItem value="2">2 - Dirty</SelectItem>
                            <SelectItem value="3">3 - Average</SelectItem>
                            <SelectItem value="4">4 - Clean</SelectItem>
                            <SelectItem value="5">5 - Very Clean</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trashManagementRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trash Management Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Below Average</SelectItem>
                            <SelectItem value="3">3 - Average</SelectItem>
                            <SelectItem value="4">4 - Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parksQualityRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parks & Green Spaces Quality *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Below Average</SelectItem>
                            <SelectItem value="3">3 - Average</SelectItem>
                            <SelectItem value="4">4 - Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="noiseLevel"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Noise Level *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Very quiet" id="vquiet" />
                            <Label htmlFor="vquiet" className="font-normal cursor-pointer">
                              Very quiet
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Quiet" id="quiet" />
                            <Label htmlFor="quiet" className="font-normal cursor-pointer">
                              Quiet
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Moderate" id="moderate" />
                            <Label htmlFor="moderate" className="font-normal cursor-pointer">
                              Moderate
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Loud" id="loud" />
                            <Label htmlFor="loud" className="font-normal cursor-pointer">
                              Loud
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Very loud" id="vloud" />
                            <Label htmlFor="vloud" className="font-normal cursor-pointer">
                              Very loud
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="environmentalTestimonial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environmental Testimonial (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your thoughts about cleanliness and the environment..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your feedback helps improve neighborhood cleanliness initiatives.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Food & Amenities */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-semibold">Food & Amenities</h3>

                <FormField
                  control={form.control}
                  name="groceryStoreAccess"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Grocery Store Access *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Walk < 5min" id="walk5" />
                            <Label htmlFor="walk5" className="font-normal cursor-pointer">
                              Walk less than 5 minutes
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Walk 5-15min" id="walk15" />
                            <Label htmlFor="walk15" className="font-normal cursor-pointer">
                              Walk 5-15 minutes
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Walk 15-30min" id="walk30" />
                            <Label htmlFor="walk30" className="font-normal cursor-pointer">
                              Walk 15-30 minutes
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Drive required" id="drive" />
                            <Label htmlFor="drive" className="font-normal cursor-pointer">
                              Drive required
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="No access" id="noaccess" />
                            <Label htmlFor="noaccess" className="font-normal cursor-pointer">
                              No easy access
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restaurantVarietyRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Variety Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Limited</SelectItem>
                            <SelectItem value="2">2 - Limited</SelectItem>
                            <SelectItem value="3">3 - Adequate</SelectItem>
                            <SelectItem value="4">4 - Good Variety</SelectItem>
                            <SelectItem value="5">5 - Excellent Variety</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foodAffordabilityRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Affordability Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Very Expensive</SelectItem>
                            <SelectItem value="2">2 - Expensive</SelectItem>
                            <SelectItem value="3">3 - Moderate</SelectItem>
                            <SelectItem value="4">4 - Affordable</SelectItem>
                            <SelectItem value="5">5 - Very Affordable</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="farmersMarketAccess"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>I have access to a farmers market in my neighborhood</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foodAccessTestimonial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Access Testimonial (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your experience with food access in your neighborhood..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Help us understand food accessibility in your area.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 5: Financials & Living Costs */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-semibold">Financials & Living Costs</h3>

                <FormField
                  control={form.control}
                  name="rentAffordability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent/Mortgage Affordability *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select affordability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Very affordable">Very affordable</SelectItem>
                          <SelectItem value="Affordable">Affordable</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Expensive">Expensive</SelectItem>
                          <SelectItem value="Very expensive">Very expensive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costOfLiving"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Cost of Living *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cost level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Very low">Very low</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Very high">Very high</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valueForMoneyRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value for Money Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor Value</SelectItem>
                            <SelectItem value="2">2 - Below Average</SelectItem>
                            <SelectItem value="3">3 - Fair Value</SelectItem>
                            <SelectItem value="4">4 - Good Value</SelectItem>
                            <SelectItem value="5">5 - Excellent Value</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financialTestimonial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financial Testimonial (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your thoughts about the cost of living in your neighborhood..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Your insights help others understand living costs in this area.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 6: Overall Feedback */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <h3 className="text-lg font-semibold">Overall Feedback</h3>

                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Neighborhood Rating *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Fair</SelectItem>
                            <SelectItem value="3">3 - Good</SelectItem>
                            <SelectItem value="4">4 - Very Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wouldRecommend"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>I would recommend this neighborhood to others</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biggestStrength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is the biggest strength of your neighborhood? *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what you love most about your neighborhood..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areaForImprovement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What area needs the most improvement? *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what could be better in your neighborhood..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any other thoughts you'd like to share..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Survey
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Auto-save indicator */}
            <p className="text-xs text-center text-muted-foreground">Your progress is automatically saved</p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
