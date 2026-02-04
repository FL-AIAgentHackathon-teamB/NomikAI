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

1.  **Identify the dish:** Identify the name of the main dish and set the \`foodName\` field.
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
