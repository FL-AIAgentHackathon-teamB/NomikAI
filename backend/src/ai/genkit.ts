import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';

export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: process.env.GCP_PROJECT_ID || 'nomikai-485006',
      location: process.env.VERTEX_AI_REGION || 'asia-northeast1',
    }),
  ],
  model: 'vertexai/gemini-2.5-flash',
});
