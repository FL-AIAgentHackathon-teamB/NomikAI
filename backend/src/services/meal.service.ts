import {
  analyzeMealAndSuggestRefinement, 
  type AnalyzeMealAndSuggestRefinementInput,
  reanalyzeMealWithCustomName,
  type ReanalyzeMealWithCustomNameInput
} from '../ai/analyze-meal';

export class MealService {
  async analyzeMeal(input: AnalyzeMealAndSuggestRefinementInput) {
    try {
      const result = await analyzeMealAndSuggestRefinement(input);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Error analyzing meal:", error);
      return { success: false, error: `Failed to analyze meal. ${errorMessage}` };
    }
  }

  async reanalyzeMeal(input: ReanalyzeMealWithCustomNameInput) {
    try {
      const result = await reanalyzeMealWithCustomName(input);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Error reanalyzing meal:", error);
      return { success: false, error: `Failed to reanalyze meal. ${errorMessage}` };
    }
  }
}
