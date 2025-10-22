
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
import type { Message } from '@/lib/types';

const GenerateAnswerInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  fileDataUri: z.string().optional().describe("A base64 encoded data URI of a file (image, text, etc.)."),
  history: z.array(z.any()).optional().describe('The chat history.'),
});
export type GenerateAnswerInput = z.infer<
  typeof GenerateAnswerInputSchema
>;

export async function generateAnswer(
  input: GenerateAnswerInput,
  signal: AbortSignal
): Promise<string> {
  const { question, fileDataUri, history } = input;
  
  const prompt: any[] = [];

  // 1. Process and add the chat history to the prompt array.
  // Each message's content must be an array of Parts.
  if (history) {
    history.forEach((msg: Message) => {
      // Only include user and assistant messages that have string content.
      if ((msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        // Content MUST be an array of parts, e.g., [{ text: '...' }]
        prompt.push({ role, content: [{ text: msg.content }] });
      }
    });
  }

  // 2. Prepare the content for the current user question.
  // The content must be an array of Parts.
  const userContent: any[] = [];
  
  if (fileDataUri) {
    // If a file is attached, add the media part first.
    userContent.push({ media: { url: fileDataUri } });
  }

  // Add the text part of the user's question.
  userContent.push({ text: question });

  // 3. Add the current user message to the prompt array.
  prompt.push({ role: 'user', content: userContent });


  const llmResponse = await ai.generate({
    prompt: prompt,
    model: 'googleai/gemini-2.5-flash',
    system: `You are a helpful AI assistant named freechat tutor. You are an expert exam writing tutor and a mathematics genius. You can provide practice questions, grade answers, give feedback on writing style, explain complex concepts, and offer exam strategies. You can also answer general questions on any topic.

When a user asks "who made you", you must reply "I was made by freecrashcourse.org".

When a user asks a math question, solve it and show your work. Format all mathematical equations, variables, and symbols using LaTeX. For block display, you MUST use $$...$$. For inline display, you MUST use $...$. For example, an inline expression would be written as: $E = mc^2$. A block expression would be: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$

To explain concepts visually, you can draw simple text-based (ASCII) diagrams inside markdown code blocks. For example:
\`\`\`
   +----------+
   |  Box A   |
   +----------+
\`\`\``,
    output: {
      format: 'text',
    },
  }, { signal });

  return llmResponse.text;
}
