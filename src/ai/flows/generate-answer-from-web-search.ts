'use server';

/**
 * @fileOverview This file defines a Genkit flow that answers user questions by searching the web
 *  and using an AI model to generate a comprehensive answer based on the search results.
 *
 * - streamAnswerFromWebSearch - The function to generate answers from web search results.
 * - GenerateAnswerFromWebSearchInput - The input type for the streamAnswerFromWebSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {searchTheWeb} from '@/services/search';
import { __SOURCES_DELIMITER__ } from '@/app/page';

const GenerateAnswerFromWebSearchInputSchema = z.object({
  question: z.string().describe('The question to answer using web search.'),
});
export type GenerateAnswerFromWebSearchInput = z.infer<
  typeof GenerateAnswerFromWebSearchInputSchema
>;

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

export async function streamAnswerFromWebSearch(
  input: GenerateAnswerFromWebSearchInput
): Promise<ReadableStream<string>> {
  const { stream, response } = ai.generate({
    model: 'gemini-2.5-flash',
    prompt: `Question: ${input.question}`,
    tools: [webSearchTool],
    system: `You are a helpful assistant. Your goal is to answer the user's question.

- If the user's question is clearly informational and requires up-to-date facts or data from the web, you MUST use the \`searchTheWeb\` tool.
- If the user's question is creative, subjective, a request for a story/poem, a math problem, or can be answered with general knowledge, you MUST NOT use the \`searchTheWeb\` tool. Answer it directly.
- When you use the \`searchTheWeb\` tool, your answer must be based on the content of the web pages you find.
- When you use search, you must include the links to the sources in your answer.`,
  });

  const encoder = new TextEncoder();
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      if (chunk.text) {
        controller.enqueue(encoder.encode(chunk.text));
      }
    },
  });
  
  const writer = transformStream.writable.getWriter();
  (async () => {
    try {
        for await (const chunk of stream) {
            if (chunk.text) {
                await writer.write(encoder.encode(chunk.text));
            }
        }
        const finalResponse = await response;
        const sources = finalResponse.toolRequests
          .map(tr => tr.tool.output?.results)
          .flat()
          .filter(Boolean) as string[];

        if (sources.length > 0) {
          await writer.write(encoder.encode( __SOURCES_DELIMITER__ + JSON.stringify(sources)));
        }
    } catch (e) {
        console.error('Error during stream processing:', e);
        writer.abort(e);
    } finally {
        writer.close();
    }
  })();

  return transformStream.readable;
}
