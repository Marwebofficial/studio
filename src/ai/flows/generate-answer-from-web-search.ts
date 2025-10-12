'use server';

/**
 * @fileOverview This file defines a Genkit flow that answers user questions
 * by using an AI model to generate a comprehensive answer.
 *
 * - generateAnswer - The function to generate answers.
 * - GenerateAnswerInput - The input type for the generateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAnswerInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
});
export type GenerateAnswerInput = z.infer<
  typeof GenerateAnswerInputSchema
>;

export async function generateAnswer(
  input: GenerateAnswerInput
): Promise<string> {
  const { text } = await ai.generate({
    prompt: input.question,
    system: `You are a helpful and intelligent assistant. Your primary goal is to answer the user's question accurately and concisely.`,
  });

  return text;
}
