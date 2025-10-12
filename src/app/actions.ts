'use server';

import {
  generateAnswer,
} from '@/ai/flows/generate-answer-from-web-search';
import { z } from 'zod';

const QuestionSchema = z.string().min(1, 'Question cannot be empty.');

export async function getAnswer(
  question: string
): Promise<string> {
  const validatedQuestion = QuestionSchema.parse(question);
  return generateAnswer({ question: validatedQuestion });
}
