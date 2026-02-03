/**
 * OpenRouter API client wrapper
 * Uses OpenAI SDK since OpenRouter is OpenAI-compatible
 */

import OpenAI from 'openai';
import type { ModelResult, JudgeResult } from './types.js';

export class OpenRouterClient {
  private client: OpenAI;
  private verbose: boolean;

  // Pricing per 1M tokens (approximate, will be updated from actual usage)
  private static PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'claude-3.5-sonnet': { input: 3, output: 15 },
    'claude-opus-4.5': { input: 15, output: 75 },
    'llama-3.3-70b': { input: 0.35, output: 0.4 },
    'qwen-2.5-72b': { input: 0.35, output: 0.4 },
  };

  constructor(apiKey: string, verbose: boolean = false) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://github.com/evoprompt',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'EvoPrompt',
      },
    });
    this.verbose = verbose;
  }

  /**
   * Run a prompt on a specific model
   */
  async runPrompt(
    model: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<ModelResult> {
    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        stream: false,
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Estimate first token time (since we're not streaming)
      firstTokenTime = totalTime * 0.1; // Rough estimate

      const usage = response.usage!;
      const output = response.choices[0].message.content || '';

      const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);
      const speed = usage.completion_tokens / (totalTime / 1000);

      return {
        model,
        output,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
        speed,
        latency: firstTokenTime,
        judgeScores: [],
        averageScore: 0,
      };
    } catch (error: any) {
      if (this.verbose) {
        console.error(`Error running prompt on ${model}:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Judge an output using a judge model
   */
  async judgeOutput(
    judgeModel: string,
    output: string,
    criteria: string = 'Rate the quality, accuracy, and usefulness of this output on a scale of 0-10. Respond with ONLY a number.'
  ): Promise<JudgeResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: judgeModel,
        messages: [
          { role: 'system', content: criteria },
          { role: 'user', content: `Output to evaluate:\n\n${output}` }
        ],
        temperature: 0.3,
      });

      const usage = response.usage!;
      const content = response.choices[0].message.content || '0';

      // Extract number from response
      const match = content.match(/\d+(\.\d+)?/);
      const score = match ? parseFloat(match[0]) : 0;

      // Clamp score to 0-10
      const clampedScore = Math.max(0, Math.min(10, score));

      const cost = this.calculateCost(judgeModel, usage.prompt_tokens, usage.completion_tokens);

      return {
        judge: judgeModel,
        score: clampedScore,
        reasoning: content,
        cost,
      };
    } catch (error: any) {
      if (this.verbose) {
        console.error(`Error judging with ${judgeModel}:`, error.message);
      }
      // Return neutral score on error
      return {
        judge: judgeModel,
        score: 5,
        cost: 0,
      };
    }
  }

  /**
   * Use LLM to mutate a prompt
   */
  async mutatePrompt(
    prompt: string,
    strategy: string,
    mutationModel: string = 'gpt-4o-mini'
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: mutationModel,
        messages: [
          {
            role: 'system',
            content: 'You are a prompt engineering expert. Your job is to improve prompts based on the given strategy.'
          },
          {
            role: 'user',
            content: `Strategy: ${strategy}\n\nOriginal prompt:\n${prompt}\n\nImproved prompt:`
          }
        ],
        temperature: 0.8,
      });

      return response.choices[0].message.content || prompt;
    } catch (error: any) {
      if (this.verbose) {
        console.error('Error mutating prompt:', error.message);
      }
      return prompt; // Return original on error
    }
  }

  /**
   * Use LLM to crossover two prompts
   */
  async crossoverPrompts(
    prompt1: string,
    prompt2: string,
    crossoverModel: string = 'gpt-4o-mini'
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: crossoverModel,
        messages: [
          {
            role: 'system',
            content: 'You are a prompt engineering expert. Combine the best aspects of two prompts into a single improved prompt.'
          },
          {
            role: 'user',
            content: `Prompt 1:\n${prompt1}\n\nPrompt 2:\n${prompt2}\n\nCombined prompt:`
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || prompt1;
    } catch (error: any) {
      if (this.verbose) {
        console.error('Error crossing over prompts:', error.message);
      }
      return prompt1; // Return first prompt on error
    }
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = OpenRouterClient.PRICING[model] || { input: 1, output: 1 };
    return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  }
}
