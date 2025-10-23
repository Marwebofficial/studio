'use server';
/**
 * @fileOverview A flow for running and explaining code snippets.
 *
 * - runCode - A function that handles code execution analysis.
 */

import {ai} from '@/ai/genkit';
import { RunCodeInputSchema, RunCodeOutputSchema, type RunCodeInput, type RunCodeOutput } from '@/lib/types';


export async function runCode(input: RunCodeInput): Promise<RunCodeOutput> {
  return runCodeFlow(input);
}

const runCodeFlow = ai.defineFlow(
  {
    name: 'runCodeFlow',
    inputSchema: RunCodeInputSchema,
    outputSchema: RunCodeOutputSchema,
  },
  async ({ code }) => {
    const prompt = `You are a code interpreter and programming tutor. Analyze the following code snippet.
Provide the simulated output as if it were run in a console.
Then, provide a clear, step-by-step explanation of the code's functionality, syntax, and any important programming concepts demonstrated.

Code to analyze:
\`\`\`
${code}
\`\`\`

Return the result in the specified JSON format. The explanation should be formatted using markdown.`;
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: prompt,
        output: {
            schema: RunCodeOutputSchema,
        },
        system: 'You are an expert code interpreter and programming tutor. You analyze code and provide its output and a detailed explanation.',
    });

    if (!output) {
        throw new Error('Code analysis failed.');
    }
    
    return output;
  }
);
