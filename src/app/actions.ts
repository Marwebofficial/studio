'use server';

import {
  generateAnswer,
  type GenerateAnswerInput,
} from '@/ai/flows/generate-answer-from-web-search';
import { z } from 'zod';

const QuestionSchema = z.string().min(1, 'Question cannot be empty.');
const FileSchema = z.string().optional();

export async function getAnswer(
  question: string,
  fileDataUri?: string,
): Promise<string> {
  const validatedQuestion = QuestionSchema.parse(question);
  const validatedFile = FileSchema.parse(fileDataUri);

  const input: GenerateAnswerInput = { question: validatedQuestion };
  if (validatedFile) {
    input.fileDataUri = validatedFile;
  }
  
  return generateAnswer(input);
}

    