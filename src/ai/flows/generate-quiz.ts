'use server';
/**
 * @fileOverview A flow for generating a quiz from a text prompt.
 *
 * - generateQuiz - A function that handles quiz generation.
 * - QuizQuestion - The type for a single quiz question.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuizQuestionSchema = z.object({
    question: z.string().describe('The quiz question.'),
    options: z.array(z.string()).describe('An array of 4 multiple-choice options.'),
    answer: z.number().describe('The index of the correct answer in the options array.'),
    explanation: z.string().describe('A brief explanation of the correct answer.'),
});

const GenerateQuizOutputSchema = z.object({
    title: z.string().describe('A title for the quiz.'),
    questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(topic: string): Promise<GenerateQuizOutput> {
  return generateQuizFlow(topic);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: z.string(),
    outputSchema: GenerateQuizOutputSchema,
  },
  async (topic) => {
    const prompt = `Generate a challenging 5-question multiple-choice quiz about ${topic}. The questions should be high-quality and suitable for exam preparation. Provide 4 options for each question. Include the correct answer's index and a detailed explanation for the correct answer.`;
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: prompt,
        output: {
            schema: GenerateQuizOutputSchema,
        },
        system: 'You are an expert quiz creator for a variety of exam standards and general knowledge. You create challenging and high-quality questions.',
    });

    if (!output) {
        throw new Error('Quiz generation failed.');
    }
    
    return output;
  }
);
