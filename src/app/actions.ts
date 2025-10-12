'use server';

import {
  streamAnswerFromWebSearch,
} from '@/ai/flows/generate-answer-from-web-search';
import { z } from 'zod';

const QuestionSchema = z.string().min(1, 'Question cannot be empty.');

export async function streamAnswer(
  question: string
): Promise<ReadableStream<string>> {
  const validatedQuestion = QuestionSchema.parse(question);
  return streamAnswerFromWebSearch({ question: validatedQuestion });
}
