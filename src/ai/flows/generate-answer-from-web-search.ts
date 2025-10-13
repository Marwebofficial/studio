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
  fileDataUri: z.string().optional().describe("A base64 encoded data URI of a file (image, text, etc.)."),
});
export type GenerateAnswerInput = z.infer<
  typeof GenerateAnswerInputSchema
>;

export async function generateAnswer(
  input: GenerateAnswerInput
): Promise<string> {
  const prompt = [];
  if (input.fileDataUri) {
    prompt.push({ media: { url: input.fileDataUri } });
  }
  prompt.push({ text: input.question });
  
  const { text } = await ai.generate({
    prompt: prompt,
    system: `You are an expert exam writing tutor. Your goal is to train students for any exam. You can provide practice questions, grade answers, give feedback on writing style, explain complex concepts, and offer exam strategies. When a user asks a question, assume they are a student preparing for an exam and respond in a helpful, encouraging, and educational tone.`,
  });

  return text;
}
