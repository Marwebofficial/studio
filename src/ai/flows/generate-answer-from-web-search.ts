'use server';

/**
 * @fileOverview This file defines a Genkit flow that answers user questions by searching the web
 *  and using an AI model to generate a comprehensive answer based on the search results.
 *
 * - generateAnswerFromWebSearch - The function to generate answers from web search results.
 * - GenerateAnswerFromWebSearchInput - The input type for the generateAnswerFromWebSearch function.
 * - GenerateAnswerFromWebSearchOutput - The output type for the generateAnswerFromWebSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {searchTheWeb} from '@/services/search';

const GenerateAnswerFromWebSearchInputSchema = z.object({
  question: z.string().describe('The question to answer using web search.'),
});
export type GenerateAnswerFromWebSearchInput = z.infer<
  typeof GenerateAnswerFromWebSearchInputSchema
>;

const GenerateAnswerFromWebSearchOutputSchema = z.object({
  answer: z.string().describe('The comprehensive answer to the question.'),
  sources: z.array(z.string()).describe('The URLs of the web pages used to generate the answer.'),
});
export type GenerateAnswerFromWebSearchOutput = z.infer<
  typeof GenerateAnswerFromWebSearchOutputSchema
>;

export async function generateAnswerFromWebSearch(
  input: GenerateAnswerFromWebSearchInput
): Promise<GenerateAnswerFromWebSearchOutput> {
  return generateAnswerFromWebSearchFlow(input);
}

const webSearchTool = ai.defineTool({
  name: 'searchTheWeb',
  description: 'Searches the web for relevant information related to a query.',
  inputSchema: z.object({
    query: z.string().describe('The search query.'),
  }),
  outputSchema: z.object({
    results: z.array(z.string()).describe('A list of relevant URLs from the web search.'),
  }),
},
async (input) => {
  const results = await searchTheWeb(input.query);
  return { results: results };
});

const answerPrompt = ai.definePrompt({
  name: 'answerPrompt',
  input: {schema: GenerateAnswerFromWebSearchInputSchema},
  output: {schema: GenerateAnswerFromWebSearchOutputSchema},
  tools: [webSearchTool],
  prompt: `Answer the following question. If the question is informational, use the web search tool to find relevant information. If the question is creative or doesn't require a search, answer it directly.

Question: {{{question}}}

When you use the searchTheWeb tool, your answer must be based on the content of the web pages you find. Include the links to the sources in the answer.
`,
});

const generateAnswerFromWebSearchFlow = ai.defineFlow(
  {
    name: 'generateAnswerFromWebSearchFlow',
    inputSchema: GenerateAnswerFromWebSearchInputSchema,
    outputSchema: GenerateAnswerFromWebSearchOutputSchema,
  },
  async input => {
    const {output} = await answerPrompt(input);
    return output!;
  }
);
