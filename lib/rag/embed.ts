/**
 * Embedding Helper
 * Wraps OpenAI embeddings with retry logic and error handling
 */

import OpenAI from 'openai';

// Lazy initialization - only create client when actually needed (not at build time)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

/**
 * Generate embedding for text with retry logic
 * @param text - Text to embed
 * @param retries - Number of retry attempts (default: 3)
 * @returns Embedding vector and metadata
 */
export async function embedText(
  text: string,
  retries: number = 3
): Promise<EmbeddingResult> {
  const model = 'text-embedding-3-small';
  const dimensions = 1536;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const openai = getOpenAIClient();
      const response = await openai.embeddings.create({
        model: model,
        input: text,
        dimensions: dimensions,
      });

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
        model: model,
      };

    } catch (error: any) {
      const isLastAttempt = attempt === retries - 1;

      if (isLastAttempt) {
        console.error(`Embedding failed after ${retries} attempts:`, error.message);
        throw new Error(`Failed to generate embedding: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`Embedding attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Failed to generate embedding');
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to embed
 * @param batchSize - Number of texts per API call (default: 100)
 * @returns Array of embeddings
 */
export async function embedTextBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    try {
      const openai = getOpenAIClient();
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
        dimensions: 1536,
      });

      const batchEmbeddings = response.data.map(d => d.embedding);
      embeddings.push(...batchEmbeddings);

    } catch (error: any) {
      console.error(`Batch embedding failed for batch ${i / batchSize + 1}:`, error.message);
      throw error;
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}

/**
 * Estimate cost for embedding text
 * @param tokens - Number of tokens
 * @returns Estimated cost in USD
 */
export function estimateEmbeddingCost(tokens: number): number {
  const costPer1M = 0.02; // $0.02 per 1M tokens for text-embedding-3-small
  return (tokens / 1_000_000) * costPer1M;
}
