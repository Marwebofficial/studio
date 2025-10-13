'use server';

import {
  generateAnswer,
  type GenerateAnswerInput,
} from '@/ai/flows/generate-answer-from-web-search';
import { z } from 'zod';

const QuestionSchema = z.string().min(1, 'Question cannot be empty.');
const ImageSchema = z.string().optional();

export async function getAnswer(
  question: string,
  imageDataUri?: string,
): Promise<string> {
  const validatedQuestion = QuestionSchema.parse(question);
  const validatedImage = ImageSchema.parse(imageDataUri);

  const input: GenerateAnswerInput = { question: validatedQuestion };
  if (validatedImage) {
    input.imageDataUri = validatedImage;
  }
  
  return generateAnswer(input);
}
