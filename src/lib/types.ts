

import { z } from 'zod';
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'error' | 'system';
    content: string | React.ReactNode;
    fileDataUri?: string;
    imageUrl?: string;
    quiz?: GenerateQuizOutput;
    programs?: any[]; // For student program system messages
    createdAt?: any;
};
  
export type Chat = {
    id: string;
    title: string;
    messages?: Message[];
    createdAt: any;
};

export type QuizQuestion = {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
};

export const RunCodeInputSchema = z.object({
    code: z.string().describe('The code snippet to analyze.'),
    language: z.string().describe('The programming language of the code.'),
});
export type RunCodeInput = z.infer<typeof RunCodeInputSchema>;

export const RunCodeOutputSchema = z.object({
    output: z.string().describe('The simulated output of the code.'),
    explanation: z.string().describe('A markdown-formatted explanation of the code.'),
});
export type RunCodeOutput = z.infer<typeof RunCodeOutputSchema>;
