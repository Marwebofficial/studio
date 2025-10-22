
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
import {
    generateQuiz,
    type GenerateQuizOutput,
} from '@/ai/flows/generate-quiz';
import type { Message } from '@/lib/types';

export async function getAnswer(
  question: string,
  fileDataUri: string | undefined,
  history: Message[],
  signal: AbortSignal
): Promise<{ answer: string; error?: string }> {
  try {
    const input: GenerateAnswerInput = { question, history };
    if (fileDataUri) {
        input.fileDataUri = fileDataUri;
    }
    const answer = await generateAnswer(input, signal);
    return { answer };
  } catch (e: any) {
    console.error(e);
    if (e.name === 'AbortError') {
        return { answer: '', error: 'Request aborted.' };
    }
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

export async function getQuiz(
    topic: string
    ): Promise<{ quiz?: GenerateQuizOutput; error?: string }> {
    try {
        const quiz = await generateQuiz(topic);
        return { quiz };
    } catch (e: any) {
        console.error(e);
        return {
            error: e.message || 'An error occurred during quiz generation.',
        };
    }
}

    