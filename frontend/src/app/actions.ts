"use server";

import type { AnalyzeMealAndSuggestRefinementInput } from "@/ai/flows/analyze-meal-and-suggest-refinement";
import { GoogleAuth } from 'google-auth-library';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Cloud Run IAM認証付きでバックエンドAPIを呼び出す
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
    // ローカル開発環境では認証なし
    if (IS_DEVELOPMENT) {
        return fetch(url, options);
    }

    // Cloud Run本番環境ではIDトークンを取得
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(BACKEND_URL);
    const idToken = await client.idTokenProvider.fetchIdToken(BACKEND_URL);

    // IDトークンをAuthorizationヘッダーに追加
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${idToken}`,
    };

    return fetch(url, { ...options, headers });
}

export async function analyzeMeal(input: AnalyzeMealAndSuggestRefinementInput) {
    try {
        // バックエンドAPIを呼び出す（IAM認証付き）
        const response = await fetchWithAuth(`${BACKEND_URL}/api/v1/meals/analyze`, {
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
