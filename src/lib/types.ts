

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
    code: z.string().describe('The code snippet to execute and explain.'),
});
export type RunCodeInput = z.infer<typeof RunCodeInputSchema>;
  
export const RunCodeOutputSchema = z.object({
    output: z.string().describe('The simulated output of the code (e.g., console logs).'),
    explanation: z.string().describe('A detailed, step-by-step explanation of what the code does, including its logic and key concepts.'),
});
export type RunCodeOutput = z.infer<typeof RunCodeOutputSchema>;
    
