'use server';

/**
 * @fileOverview A calorie advice AI agent.
 *
 * - giveCalorieAdvice - A function that handles the calorie advice process.
 * - GiveCalorieAdviceInput - The input type for the giveCalorieAdvice function.
 * - GiveCalorieAdviceOutput - The return type for the giveCalorieAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GiveCalorieAdviceInputSchema = z.object({
  remainingCalories: z
    .number()
    .describe('The remaining calories available for the day.'),
  foodName: z.string().describe('The name of the food to be consumed.'),
  foodCalories: z.number().describe('The estimated calories of the food.'),
});
export type GiveCalorieAdviceInput = z.infer<typeof GiveCalorieAdviceInputSchema>;

const GiveCalorieAdviceOutputSchema = z.object({
  advice: z.string().describe('The advice on whether to eat the food or not.'),
});
export type GiveCalorieAdviceOutput = z.infer<typeof GiveCalorieAdviceOutputSchema>;

export async function giveCalorieAdvice(input: GiveCalorieAdviceInput): Promise<GiveCalorieAdviceOutput> {
  return giveCalorieAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'giveCalorieAdvicePrompt',
  input: {schema: GiveCalorieAdviceInputSchema},
  output: {schema: GiveCalorieAdviceOutputSchema},
  prompt: `You are a helpful AI assistant that provides advice on whether a user should eat a certain food based on their remaining calories. Your response must be in Japanese.

  Remaining Calories: {{{remainingCalories}}}
  Food: {{{foodName}}}
  Food Calories: {{{foodCalories}}}

  Based on the information above, provide a concise advice on whether the user can eat the food. Consider the food calories relative to the remaining calories. If the food calories are less than the remaining calories, suggest that they can eat it. If the food calories are close to or exceed the remaining calories, advise them to eat in moderation or choose a different food. Be friendly and encouraging.
  `,
});

const giveCalorieAdviceFlow = ai.defineFlow(
  {
    name: 'giveCalorieAdviceFlow',
    inputSchema: GiveCalorieAdviceInputSchema,
    outputSchema: GiveCalorieAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
