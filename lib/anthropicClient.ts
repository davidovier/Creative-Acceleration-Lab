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
 * Call Claude with robust JSON parsing fallback
 * If first attempt fails, retries with stricter prompt
 * If second attempt fails, returns safe fallback object with error
 */
export async function callClaudeWithFallback<T = any>(
  systemPrompt: string,
  userMessage: string,
  fallbackObject: T,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<T> {
  try {
    // First attempt - normal call
    return await callClaude<T>(systemPrompt, userMessage, options);
  } catch (firstError: any) {
    // Log first attempt failure
    console.warn('⚠️  First Claude call failed to parse JSON:', firstError.message);

    // Check if it's a JSON parsing error
    if (!firstError.message.includes('parse') && !firstError.message.includes('JSON')) {
      // If it's not a parsing error (e.g., network issue), throw immediately
      throw firstError;
    }

    try {
      // Second attempt with stricter prompt
      console.log('🔄 Retrying with stricter JSON-only prompt...');

      const stricterSystemPrompt = `${systemPrompt}

⚠️ CRITICAL: Your previous response could not be parsed as valid JSON.
You MUST respond with ONLY valid JSON. No text outside the JSON object.
No explanations. No commentary. No markdown. Just pure, valid JSON.`;

      return await callClaude<T>(stricterSystemPrompt, userMessage, options);
    } catch (secondError: any) {
      // Both attempts failed - log and return fallback
      console.error('❌ Second Claude call also failed. Using fallback object.');
      console.error('Second error:', secondError.message);

      // Return fallback object with error info
      return {
        ...fallbackObject,
        error: 'Failed to parse valid JSON after 2 attempts',
        raw_error: secondError.message,
      } as T;
    }
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
