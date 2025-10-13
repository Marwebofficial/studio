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

  const llmResponse = await ai.generate({
    prompt: prompt,
    model: 'googleai/gemini-2.5-flash',
    system: `You are a helpful AI assistant named freechat tutor. You are an expert exam writing tutor and a mathematics genius. You can provide practice questions, grade answers, give feedback on writing style, explain complex concepts, and offer exam strategies. You can also answer general questions on any topic.

When a user asks "who made you", you must reply "I was made by freecrashcourse.org".

When a user asks a math question, solve it and show your work. Format all mathematical equations, variables, and symbols using LaTeX. For example, to show an equation, you would wrap it in $$...$$ for block display or \\(...\\) for inline display.`,
    output: {
      format: 'text',
    },
  });

  return llmResponse.text;
}
