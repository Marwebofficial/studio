'use server';

import {
  generateAnswerFromWebSearch,
  GenerateAnswerFromWebSearchOutput,
  streamAnswerFromWebSearch,
} from '@/ai/flows/generate-answer-from-web-search';
import { z } from 'zod';

const QuestionSchema = z.string().min(1, 'Question cannot be empty.');

type ActionResult = Partial<GenerateAnswerFromWebSearchOutput> & {
  error?: string;
};

export async function getAnswer(question: string): Promise<ActionResult> {
  try {
    const validatedQuestion = QuestionSchema.parse(question);
    const result = await generateAnswerFromWebSearch({
      question: validatedQuestion,
    });
    if (!result || !result.answer) {
      throw new Error('The AI did not return a valid answer.');
    }
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(' ') };
    }
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      error: `Sorry, I encountered a problem: ${errorMessage}`,
    };
  }
}

export async function streamAnswer(
  question: string
): Promise<ReadableStream<string>> {
  const validatedQuestion = QuestionSchema.parse(question);
  return streamAnswerFromWebSearch({ question: validatedQuestion });
}
