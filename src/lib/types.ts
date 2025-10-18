
import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz";

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'error' | 'system';
    content: string | React.ReactNode;
    fileDataUri?: string;
    imageUrl?: string;
    quiz?: GenerateQuizOutput;
    createdAt: string;
};
  
export type Chat = {
    id: string;
    messages: Message[];
    createdAt: string;
};

export type QuizQuestion = {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
};
