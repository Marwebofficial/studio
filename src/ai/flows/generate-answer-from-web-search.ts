
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
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp } from '@/lib/firebase-admin';

const GenerateAnswerInputSchema = z.object({
  question: z.string().describe('The question to answer.'),
  fileDataUri: z.string().optional().describe("A base64 encoded data URI of a file (image, text, etc.)."),
  history: z.array(z.any()).optional().describe('The chat history.'),
});
export type GenerateAnswerInput = z.infer<
  typeof GenerateAnswerInputSchema
>;

// Initialize Firestore using the admin app
const db = getFirestore(adminApp);
const cacheCollection = db.collection('cached_responses');

export async function generateAnswer(
  input: GenerateAnswerInput,
  signal: AbortSignal
): Promise<string> {
  const { question, fileDataUri, history } = input;

  // Do not cache conversations with file uploads or history for now.
  if (!fileDataUri && (!history || history.length === 0)) {
    // 1. Check cache for an existing answer.
    try {
        const snapshot = await cacheCollection.where('question', '==', question).limit(1).get();
        if (!snapshot.empty) {
            const cachedDoc = snapshot.docs[0];
            const cachedData = cachedDoc.data();
            if (cachedData && cachedData.answer) {
                console.log('Returning cached response for:', question);
                return cachedData.answer;
            }
        }
    } catch (e) {
        console.error("Error reading from cache:", e);
        // If there's an error, proceed to generate a new answer.
    }
  }


  // 2. Prepare the content for the current user question.
  const userContent: any[] = [];
  
  if (fileDataUri) {
    userContent.push({ media: { url: fileDataUri } });
  }
  userContent.push({ text: question });

  // 3. Process and map the chat history.
  const processedHistory = history?.map((msg: Message) => {
    if ((msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      return { role, content: [{ text: msg.content }] };
    }
    return null;
  }).filter(Boolean); // Filter out any null entries


  // 4. Generate the answer using the AI model.
  const llmResponse = await ai.generate({
    prompt: userContent,
    history: processedHistory,
    model: 'googleai/gemini-2.5-flash',
    system: `You are a helpful AI assistant named freechat tutor. You are an expert exam writing tutor and a mathematics genius. You can provide practice questions, grade answers, give feedback on writing style, explain complex concepts, and offer exam strategies. You can also answer general questions on any topic.

When a user asks "who made you", you must reply "I was made by freecrashcourse.org".

When a user asks a math question, solve it and show your work. Format all mathematical equations, variables, and symbols using LaTeX. For block display, you MUST use $$...$$. For inline display, you MUST use $...$. For example, an inline expression would be written as: $E = mc^2$. A block expression would be: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$

To explain concepts visually, you can draw simple text-based (ASCII) diagrams inside markdown code blocks. For example:
\`\`\`
   +----------+
   |  Box A   |
   +----------+
\`\`\`
`,
    output: {
      format: 'text',
    },
  }, { signal });

  const answer = llmResponse.text;

  // 5. Cache the new response if it's for a simple question.
  if (answer && !fileDataUri && (!history || history.length === 0)) {
      try {
          await cacheCollection.add({
              question: question,
              answer: answer,
              createdAt: new Date(),
          });
          console.log('Cached new response for:', question);
      } catch (e) {
          console.error("Error writing to cache:", e);
      }
  }


  return answer;
}
