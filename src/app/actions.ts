
'use server';

import {
  generateAnswer,
  type GenerateAnswerInput,
} from '@/ai/flows/generate-answer-from-web-search';
import {
    textToSpeech,
    type TextToSpeechOutput,
} from '@/ai/flows/text-to-speech';
import {
    generateImage,
    type GenerateImageOutput,
} from '@/ai/flows/generate-image';
import {
    generateQuiz,
    type GenerateQuizOutput,
} from '@/ai/flows/generate-quiz';
import {
    runCode,
} from '@/ai/flows/run-code';
import type { Message, RunCodeInput, RunCodeOutput } from '@/lib/types';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';


export async function getAnswer(
  question: string,
  fileDataUri: string | undefined,
  history: Message[],
  signal: AbortSignal
): Promise<{ answer: string; error?: string }> {
  try {
    // Caching is only applied to questions without images or chat history for simplicity.
    if (!fileDataUri && history.length === 0) {
        const { firestore } = initializeFirebase();
        const cacheRef = collection(firestore, 'cached_responses');
        const q = query(cacheRef, where("question", "==", question), limit(1));
        const cacheSnapshot = await getDocs(q);

        if (!cacheSnapshot.empty) {
            const cachedDoc = cacheSnapshot.docs[0];
            return { answer: cachedDoc.data().answer };
        }
    }

    const input: GenerateAnswerInput = { question, history };
    if (fileDataUri) {
        input.fileDataUri = fileDataUri;
    }
    const answer = await generateAnswer(input, signal);

    if (!fileDataUri && history.length === 0) {
        const { firestore } = initializeFirebase();
        const cacheRef = collection(firestore, 'cached_responses');
        await addDoc(cacheRef, {
            question: question,
            answer: answer,
            createdAt: serverTimestamp(),
        });
    }

    return { answer };
  } catch (e: any) {
    console.error(e);
    if (e.name === 'AbortError') {
        return { answer: '', error: 'Request aborted.' };
    }
    return {
      answer: '',
      error: e.message || 'An error occurred. Please try again.',
    };
  }
}

export async function speak(
    text: string
  ): Promise<{ media?: string; error?: string }> {
    try {
      const { media } = await textToSpeech(text);
      return { media };
    } catch (e: any) {
      console.error(e);
      return {
        error: e.message || 'An error occurred during text-to-speech.',
      };
    }
  }

export async function getImage(
    prompt: string
    ): Promise<{ imageUrl?: string; error?: string }> {
    try {
        const { imageUrl } = await generateImage(prompt);
        return { imageUrl };
    } catch (e: any) {
        console.error(e);
        return {
            error: e.message || 'An error occurred during image generation.',
        };
    }
}

export async function getQuiz(
    topic: string
    ): Promise<{ quiz?: GenerateQuizOutput; error?: string }> {
    try {
        const quiz = await generateQuiz(topic);
        return { quiz };
    } catch (e: any) {
        console.error(e);
        return {
            error: e.message || 'An error occurred during quiz generation.',
        };
    }
}

export async function executeCode(
    code: string
): Promise<{ result?: RunCodeOutput; error?: string }> {
    try {
        const result = await runCode({ code });
        return { result };
    } catch (e: any) {
        console.error(e);
        return {
            error: e.message || 'An error occurred during code execution.',
        };
    }
}
