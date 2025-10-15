'use server';

import {
  generateAnswer,
  type GenerateAnswerInput,
} from '@/ai/flows/generate-answer-from-web-search';
import {
    textToSpeech,
    type TextToSpeechOutput,
} from '@/ai/flows/text-to-speech';
import {
    generateImage,
    type GenerateImageOutput,
} from '@/ai/flows/generate-image';

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

export async function speak(
    text: string
  ): Promise<{ media?: string; error?: string }> {
    try {
      const { media } = await textToSpeech(text);
      return { media };
    } catch (e: any) {
      console.error(e);
      return {
        error: e.message || 'An error occurred during text-to-speech.',
      };
    }
  }

export async function getImage(
    prompt: string
    ): Promise<{ imageUrl?: string; error?: string }> {
    try {
        const { imageUrl } = await generateImage(prompt);
        return { imageUrl };
    } catch (e: any) {
        console.error(e);
        return {
            error: e.message || 'An error occurred during image generation.',
        };
    }
}
