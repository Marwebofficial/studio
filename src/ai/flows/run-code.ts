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
  async ({ code, language }) => {
    const prompt = `You are an expert code interpreter and programming tutor supporting multiple languages including Python, JavaScript, C++, HTML, and CSS. Analyze the following ${language} code snippet.

- For scripting languages like Python or JavaScript, provide the simulated console output.
- For markup languages like HTML/CSS, describe the visual output that would be rendered in a browser.
- After providing the output, give a clear, step-by-step explanation of the code's functionality, syntax, and key concepts.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Return the result in the specified JSON format. The explanation should be formatted using markdown.`;
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: prompt,
        output: {
            schema: RunCodeOutputSchema,
        },
        system: `You are an expert code interpreter and programming tutor. You analyze code and provide its output and a detailed explanation in markdown format.`,
    });

    if (!output) {
        throw new Error('Code analysis failed.');
    }
    
    return output;
  }
);
