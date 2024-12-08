import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

const openai = new OpenAI({
  apiKey: process.env.GLHF_API_KEY!,
  baseURL: "https://glhf.chat/api/openai/v1",
});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: "hf:meta-llama/Meta-Llama-3.1-405B-Instruct",
});

const runtime = new CopilotRuntime({
  actions: [],
});

export const POST = async (req: NextRequest) => {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
}; 