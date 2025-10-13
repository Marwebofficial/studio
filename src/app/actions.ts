'use server';

import {
  generateAnswer,
  type GenerateAnswerInput,
} from '@/ai/flows/generate-answer-from-web-search';

export async function getAnswer(
  question: string,
  fileDataUri?: string
): Promise<{ answer: string; error?: string }> {
  try {
    const input: GenerateAnswerInput = { question };
    if (fileDataUri) {
        input.fileDataUri = fileDataUri;
    }
    const answer = await generateAnswer(input);
    return { answer };
  } catch (e: any) {
    console.error(e);
    return {
      answer: '',
      error: e.message || 'An error occurred. Please try again.',
    };
  }
}
