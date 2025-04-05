// app/api/chat/route.ts

import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Call the language model
  const result = streamText({
    model: groq('qwen-qwq-32b'),
    messages,
  });

  // Respond with the stream
  return result.toDataStreamResponse();
}
