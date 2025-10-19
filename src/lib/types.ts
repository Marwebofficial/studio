

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


    