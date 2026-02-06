/**
 * @fileOverview Analyzes a meal photo and suggests calorie intake adjustments.
 */

import {ai} from './genkit';
import {z} from 'genkit';

const AnalyzeMealAndSuggestRefinementInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  remainingCalories: z.number().describe('The remaining calorie intake for the day.'),
  remainingDishes: z.number().optional().describe('The number of remaining dishes in the course meal (optional).'),
});
export type AnalyzeMealAndSuggestRefinementInput = z.infer<typeof AnalyzeMealAndSuggestRefinementInputSchema>;

const AnalyzeMealAndSuggestRefinementOutputSchema = z.object({
  foodName: z.string().describe('The name of the main dish in the photo, in Japanese.'),
  calorieEstimate: z.number().describe('The estimated calorie count of the meal.'),
  suggestedRefinement: z.string().describe('A suggestion on how to adjust calorie intake based on the meal.'),
  verdict: z.enum(['OK', 'CAUTION']).describe('A verdict on whether the user should eat the meal. "OK" if the meal calories are well within the remaining calories. "CAUTION" if the meal calories are close to or exceed the remaining calories.'),
});
export type AnalyzeMealAndSuggestRefinementOutput = z.infer<typeof AnalyzeMealAndSuggestRefinementOutputSchema>;

export async function analyzeMealAndSuggestRefinement(input: AnalyzeMealAndSuggestRefinementInput): Promise<AnalyzeMealAndSuggestRefinementOutput> {
  return analyzeMealAndSuggestRefinementFlow(input);
}

const analyzeMealAndSuggestRefinementPrompt = ai.definePrompt({
  name: 'analyzeMealAndSuggestRefinementPrompt',
  input: {schema: AnalyzeMealAndSuggestRefinementInputSchema},
  output: {schema: AnalyzeMealAndSuggestRefinementOutputSchema},
  prompt: `You are a nutrition expert analyzing a user\'s meal and providing advice on their calorie intake. Your response must be in Japanese.

Analyze the following meal photo: {{media url=photoDataUri}}

1.  **Identify the dish:** Identify the name of the main dish from the photo and set the \`foodName\` field.
2.  **Estimate calories:** Estimate the calorie count of the meal and set the \`calorieEstimate\` field.
3.  **Determine verdict:** The user has {{remainingCalories}} calories remaining for the day.
    {{#if remainingDishes}}
    - The user is at a course meal with {{remainingDishes}} dishes still to come.
    - Consider how much of this dish they should eat, keeping in mind the remaining dishes.
    {{/if}}
    - If the estimated calories are well within the remaining calories, set the \`verdict\` field to "OK".
    - If the estimated calories are close to or exceed the remaining calories, set the \`verdict\` field to "CAUTION".
    - The \`verdict\` field is mandatory.
4.  **Provide suggestion:** Based on the analysis and verdict, provide a suggestion for the user in the \`suggestedRefinement\` field.
    {{#if remainingDishes}}
    - Make sure to mention how much of this dish they should eat considering the {{remainingDishes}} remaining dishes.
    - Provide advice on pacing themselves through the course meal.
    {{/if}}`,
});

const analyzeMealAndSuggestRefinementFlow = ai.defineFlow(
  {
    name: 'analyzeMealAndSuggestRefinementFlow',
    inputSchema: AnalyzeMealAndSuggestRefinementInputSchema,
    outputSchema: AnalyzeMealAndSuggestRefinementOutputSchema,
  },
  async input => {
    const {output} = await analyzeMealAndSuggestRefinementPrompt(input);
    return output!;
  }
);

// ==================== 再分析用フロー（メニュー名指定） ====================

const ReanalyzeMealWithCustomNameInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  customFoodName: z.string().describe('The user-specified name of the dish.'),
  remainingCalories: z.number().describe('The remaining calorie intake for the day.'),
  remainingDishes: z.number().optional().describe('The number of remaining dishes in the course meal (optional).'),
});
export type ReanalyzeMealWithCustomNameInput = z.infer<typeof ReanalyzeMealWithCustomNameInputSchema>;

const ReanalyzeMealWithCustomNameOutputSchema = z.object({
  foodName: z.string().describe('The name of the dish as specified by the user, returned as-is.'),
  calorieEstimate: z.number().describe('The estimated calorie count of the meal based on the specified dish name.'),
  suggestedRefinement: z.string().describe('A suggestion on how to adjust calorie intake based on the meal.'),
  verdict: z.enum(['OK', 'CAUTION']).describe('A verdict on whether the user should eat the meal. "OK" if the meal calories are well within the remaining calories. "CAUTION" if the meal calories are close to or exceed the remaining calories.'),
});
export type ReanalyzeMealWithCustomNameOutput = z.infer<typeof ReanalyzeMealWithCustomNameOutputSchema>;

export async function reanalyzeMealWithCustomName(input: ReanalyzeMealWithCustomNameInput): Promise<ReanalyzeMealWithCustomNameOutput> {
  return reanalyzeMealWithCustomNameFlow(input);
}

const reanalyzeMealWithCustomNamePrompt = ai.definePrompt({
  name: 'reanalyzeMealWithCustomNamePrompt',
  input: {schema: ReanalyzeMealWithCustomNameInputSchema},
  output: {schema: ReanalyzeMealWithCustomNameOutputSchema},
  prompt: `You are a nutrition expert re-analyzing a meal based on a user-corrected dish name. Your response must be in Japanese.

The user has identified this dish as: **{{customFoodName}}**

Photo for reference: {{media url=photoDataUri}}

1.  **Use the specified name:** Set the \`foodName\` field to EXACTLY: "{{customFoodName}}" (do not modify or translate it).
2.  **Estimate calories:** Based on the dish name "{{customFoodName}}" and the photo, estimate the calorie count and set the \`calorieEstimate\` field.
    - Trust the user's dish name more than what you see in the image.
    - Use the photo to estimate portion size and cooking method.
3.  **Determine verdict:** The user has {{remainingCalories}} calories remaining for the day.
    {{#if remainingDishes}}
    - The user is at a course meal with {{remainingDishes}} dishes still to come.
    - Consider how much of this dish they should eat, keeping in mind the remaining dishes.
    {{/if}}
    - If the estimated calories are well within the remaining calories, set the \`verdict\` field to "OK".
    - If the estimated calories are close to or exceed the remaining calories, set the \`verdict\` field to "CAUTION".
    - The \`verdict\` field is mandatory.
4.  **Provide suggestion:** Based on the analysis and verdict, provide a suggestion for the user in the \`suggestedRefinement\` field.
    {{#if remainingDishes}}
    - Make sure to mention how much of this dish they should eat considering the {{remainingDishes}} remaining dishes.
    - Provide advice on pacing themselves through the course meal.
    {{/if}}`,
});

const reanalyzeMealWithCustomNameFlow = ai.defineFlow(
  {
    name: 'reanalyzeMealWithCustomNameFlow',
    inputSchema: ReanalyzeMealWithCustomNameInputSchema,
    outputSchema: ReanalyzeMealWithCustomNameOutputSchema,
  },
  async input => {
    const {output} = await reanalyzeMealWithCustomNamePrompt(input);
    return output!;
  }
);
