'use server';

import {
  generateAnswerStream,
  type GenerateAnswerInput,
} from '@/ai/flows/generate-answer-from-web-search';
import { createStreamableValue, type StreamableValue } from 'ai/rsc';
import { z } from 'zod';

const QuestionSchema = z.string().min(1, 'Question cannot be empty.');
const FileSchema = z.string().optional();

export async function getAnswerStream(
  question: string,
  fileDataUri?: string,
): Promise<{ output: StreamableValue<string> }> {
  const validatedQuestion = QuestionSchema.parse(question);
  const validatedFile = FileSchema.parse(fileDataUri);

  const input: GenerateAnswerInput = { question: validatedQuestion };
  if (validatedFile) {
    input.fileDataUri = validatedFile;
  }
  
  const stream = createStreamableValue();

  (async () => {
    const streamResponse = await generateAnswerStream(input);
    for await (const chunk of streamResponse) {
      stream.update(chunk);
    }
    stream.done();
  })();

  return { output: stream.value };
}
