"use server";

import type { AnalyzeMealAndSuggestRefinementInput } from "@/ai/flows/analyze-meal-and-suggest-refinement";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function analyzeMeal(input: AnalyzeMealAndSuggestRefinementInput) {
    try {
        // バックエンドAPIを呼び出す
        const response = await fetch(`${BACKEND_URL}/api/v1/meals/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        console.error("Error analyzing meal:", error);
        return { success: false, error: `Failed to analyze meal. ${errorMessage}` };
    }
}
