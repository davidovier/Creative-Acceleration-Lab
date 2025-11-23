/**
 * Anthropic Client Helper
 * Lazy initialization for Claude API with error handling
 */

import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization - only create client when actually needed (not at build time)
let anthropicClient: Anthropic | null = null;

/**
 * Get or create Anthropic client
 * Uses lazy initialization to avoid build-time environment variable requirements
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }

  return anthropicClient;
}

/**
 * Call Claude with system prompt and user message
 * Returns parsed JSON response
 */
export async function callClaude<T = any>(
  systemPrompt: string,
  userMessage: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<T> {
  const {
    model = 'claude-3-5-haiku-20241022',
    maxTokens = 2000,
    temperature = 1.0,
  } = options;

  try {
    const client = getAnthropicClient();

    const response = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');

    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response
    const jsonText = textContent.text.trim();

    // Handle markdown code blocks if present
    let cleanedJson = jsonText;
    if (jsonText.startsWith('```json')) {
      cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      cleanedJson = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(cleanedJson) as T;
    return parsed;

  } catch (error: any) {
    console.error('Claude API error:', error.message);

    // Provide more context for JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse Claude response as JSON: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Estimate cost for Claude API call
 * Based on Haiku pricing: $0.25/MTok input, $1.25/MTok output
 */
export function estimateClaudeCost(inputTokens: number, outputTokens: number): number {
  const inputCostPer1M = 0.25;
  const outputCostPer1M = 1.25;

  return (
    (inputTokens / 1_000_000) * inputCostPer1M +
    (outputTokens / 1_000_000) * outputCostPer1M
  );
}
