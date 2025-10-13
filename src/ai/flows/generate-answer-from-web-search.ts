'use server';

/**
 * @fileOverview This file defines a Genkit flow that answers user questions
 * by using an AI model to generate a comprehensive answer.
 *
 * - generateAnswer - The function to generate answers.
 * - GenerateAnswerInput - The input type for the generateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {generate} from 'genkit';
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

  const llmResponse = await generate({
    prompt: prompt,
    model: 'googleai/gemini-2.5-flash',
    system: `You are a helpful AI assistant named freechat tutor. You are also an expert exam writing tutor. You can provide practice questions, grade answers, give feedback on writing style, explain complex concepts, and offer exam strategies. You can also answer general questions on any topic. When a user asks a question, respond in a helpful, encouraging, and educational tone.`,
    output: {
      format: 'text',
    },
  });

  return llmResponse.text;
}
