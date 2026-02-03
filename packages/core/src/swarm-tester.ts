/**
 * SwarmTester - Parallel prompt testing across multiple models
 */

import { OpenRouterClient } from './openrouter-client.js';
import type {
  SwarmConfig,
  SwarmResult,
  SwarmTestResult,
  SwarmVariantResult,
  TestCase,
  PromptVariant,
  MUTATION_STRATEGIES,
} from './swarm-types.js';
import { FREE_MODELS, CHEAP_MODELS } from './swarm-types.js';

type EventCallback = (data: any) => void;

export class SwarmTester {
  private client: OpenRouterClient;
  private config: SwarmConfig;
  private eventHandlers: Map<string, EventCallback[]> = new Map();

  constructor(config: Partial<SwarmConfig> & { apiKey: string }) {
    const { apiKey, ...swarmConfig } = config;

    this.config = {
      basePrompt: swarmConfig.basePrompt || '',
      variants: swarmConfig.variants || [],
      models: swarmConfig.models || FREE_MODELS,
      judge: swarmConfig.judge || 'openai/gpt-4o-mini',
      parallelLimit: swarmConfig.parallelLimit || 5,
      autoGenerate: swarmConfig.autoGenerate || false,
      numVariants: swarmConfig.numVariants || 10,
      verbose: swarmConfig.verbose || false,
    };

    this.client = new OpenRouterClient(apiKey, this.config.verbose);
  }

  /**
   * Run swarm test: test all variants across all models in parallel
   */
  async testSwarm(overrides?: Partial<SwarmConfig>): Promise<SwarmResult> {
    const config = { ...this.config, ...overrides };

    // Generate or use provided variants
    const variants = config.autoGenerate
      ? await this.generateVariants(config.basePrompt, config.numVariants!)
      : config.variants;

    if (variants.length === 0) {
      throw new Error('No variants provided or generated');
    }

    this.emit('start', { variantsCount: variants.length, modelsCount: config.models.length });

    // Create test matrix (variants × models)
    const testMatrix = this.createTestMatrix(variants, config.models);
    const totalTests = testMatrix.length;

    if (this.config.verbose) {
      console.log(`Testing ${variants.length} variants across ${config.models.length} models (${totalTests} total tests)`);
    }

    // Run tests in parallel
    const testResults = await this.runParallel(testMatrix, config.parallelLimit!);

    // Group results by variant
    const variantResults = this.groupByVariant(testResults, variants);

    // Evaluate with judge
    const evaluated = await this.evaluateVariants(variantResults, config.judge);

    // Analyze and find winner
    const result = this.analyzeResults(evaluated, config);

    this.emit('complete', result);

    return result;
  }

  /**
   * Generate prompt variants using LLM
   */
  private async generateVariants(
    basePrompt: string,
    numVariants: number
  ): Promise<PromptVariant[]> {
    const variants: PromptVariant[] = [];

    // Always include the base prompt
    variants.push({
      name: 'original',
      prompt: basePrompt,
      strategy: 'Original prompt',
    });

    const strategies = [
      'Be more concise and direct',
      'Add specific examples',
      'Include step-by-step instructions',
      'Add constraints and requirements',
      'Make it more detailed',
      'Use analogies',
      'Focus on technical accuracy',
      'Simplify for beginners',
      'Add context and background',
      'Make it more structured',
    ];

    // Generate variants in parallel
    const generationPromises = strategies.slice(0, Math.min(numVariants - 1, strategies.length)).map(
      async (strategy, idx) => {
        try {
          const variantPrompt = await this.client.mutatePrompt(basePrompt, strategy);
          return {
            name: `variant_${idx + 1}`,
            prompt: variantPrompt,
            strategy,
          };
        } catch (error) {
          if (this.config.verbose) {
            console.error(`Failed to generate variant with strategy "${strategy}":`, error);
          }
          return null;
        }
      }
    );

    const generated = await Promise.all(generationPromises);
    const validVariants = generated.filter((v) => v !== null) as PromptVariant[];
    variants.push(...validVariants);

    return variants;
  }

  /**
   * Create test matrix (all combinations of variants and models)
   */
  private createTestMatrix(variants: PromptVariant[], models: string[]): TestCase[] {
    const matrix: TestCase[] = [];

    for (const variant of variants) {
      for (const model of models) {
        matrix.push({ variant, model });
      }
    }

    return matrix;
  }

  /**
   * Run tests in parallel with concurrency limit
   */
  private async runParallel(
    tests: TestCase[],
    limit: number
  ): Promise<SwarmTestResult[]> {
    const results: SwarmTestResult[] = [];
    const queue = [...tests];
    const active: Set<Promise<SwarmTestResult>> = new Set();

    let completed = 0;

    while (queue.length > 0 || active.size > 0) {
      // Fill up to parallel limit
      while (active.size < limit && queue.length > 0) {
        const test = queue.shift()!;
        const promise = this.runSingleTest(test).then((result) => {
          active.delete(promise);
          completed++;
          this.emit('progress', {
            completed,
            total: tests.length,
            variant: test.variant.name,
            model: test.model,
          });
          return result;
        });
        active.add(promise);
      }

      // Wait for at least one to complete
      if (active.size > 0) {
        const result = await Promise.race(active);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Run a single test: one variant on one model
   */
  private async runSingleTest(test: TestCase): Promise<SwarmTestResult> {
    try {
      const result = await this.client.runPrompt(test.model, test.variant.prompt);

      this.emit('test', {
        variant: test.variant.name,
        model: test.model,
        success: true,
      });

      return {
        variant: test.variant.name,
        prompt: test.variant.prompt,
        model: test.model,
        output: result.output,
        score: 0, // Will be filled by judge
        cost: result.cost,
        latency: result.latency,
        speed: result.speed,
      };
    } catch (error: any) {
      if (this.config.verbose) {
        console.error(`Test failed for ${test.variant.name} on ${test.model}:`, error.message);
      }

      this.emit('test', {
        variant: test.variant.name,
        model: test.model,
        success: false,
        error: error.message,
      });

      // Return minimal result on error
      return {
        variant: test.variant.name,
        prompt: test.variant.prompt,
        model: test.model,
        output: '',
        score: 0,
        cost: 0,
        latency: 0,
        speed: 0,
      };
    }
  }

  /**
   * Group test results by variant
   */
  private groupByVariant(
    results: SwarmTestResult[],
    variants: PromptVariant[]
  ): SwarmVariantResult[] {
    const grouped = new Map<string, SwarmTestResult[]>();

    for (const result of results) {
      if (!grouped.has(result.variant)) {
        grouped.set(result.variant, []);
      }
      grouped.get(result.variant)!.push(result);
    }

    return variants.map((variant) => {
      const variantResults = grouped.get(variant.name) || [];
      const scoresByModel = new Map(
        variantResults.map((r) => [r.model, r])
      );

      const costs = variantResults.map((r) => r.cost);
      const latencies = variantResults.map((r) => r.latency);
      const speeds = variantResults.map((r) => r.speed);

      return {
        variant: variant.name,
        prompt: variant.prompt,
        scoresByModel,
        avgScore: 0, // Will be filled by judge
        totalCost: costs.reduce((sum, c) => sum + c, 0),
        avgLatency: latencies.length > 0 ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length : 0,
        avgSpeed: speeds.length > 0 ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0,
      };
    });
  }

  /**
   * Evaluate all variant results using judge model
   */
  private async evaluateVariants(
    variants: SwarmVariantResult[],
    judgeModel: string
  ): Promise<SwarmVariantResult[]> {
    const evaluated: SwarmVariantResult[] = [];

    for (const variant of variants) {
      const scores: number[] = [];

      // Judge each model's output
      for (const [model, result] of variant.scoresByModel) {
        if (result.output) {
          try {
            const judgeResult = await this.client.judgeOutput(judgeModel, result.output);
            result.score = judgeResult.score;
            scores.push(judgeResult.score);

            this.emit('judge', {
              variant: variant.variant,
              model,
              score: judgeResult.score,
            });
          } catch (error) {
            if (this.config.verbose) {
              console.error(`Judge failed for ${variant.variant} on ${model}:`, error);
            }
            result.score = 0;
          }
        }
      }

      variant.avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
      evaluated.push(variant);
    }

    return evaluated;
  }

  /**
   * Analyze results and determine winner
   */
  private analyzeResults(
    variants: SwarmVariantResult[],
    config: SwarmConfig
  ): SwarmResult {
    // Sort by average score
    const sorted = [...variants].sort((a, b) => b.avgScore - a.avgScore);
    const winner = sorted[0];

    // Find best model (across all variants)
    const modelScores = new Map<string, number[]>();
    for (const variant of variants) {
      for (const [model, result] of variant.scoresByModel) {
        if (!modelScores.has(model)) {
          modelScores.set(model, []);
        }
        modelScores.get(model)!.push(result.score);
      }
    }

    const modelAvgs = Array.from(modelScores.entries()).map(([model, scores]) => ({
      model,
      avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    }));

    const bestModel = modelAvgs.sort((a, b) => b.avgScore - a.avgScore)[0].model;

    // Find fastest variant
    const fastestVariant = [...variants].sort((a, b) => a.avgLatency - b.avgLatency)[0].variant;

    // Find most consistent (lowest score variance)
    const variances = variants.map((v) => {
      const scores = Array.from(v.scoresByModel.values()).map((r) => r.score);
      const mean = v.avgScore;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
      return { variant: v.variant, variance };
    });
    const mostConsistent = variances.sort((a, b) => a.variance - b.variance)[0].variant;

    // Calculate total cost
    const totalCost = variants.reduce((sum, v) => sum + v.totalCost, 0);

    // Estimate cost savings vs paid models (rough estimate)
    const paidModelCost = totalCost * 3; // Free models are ~3x cheaper
    const costSavings = ((paidModelCost - totalCost) / paidModelCost) * 100;

    return {
      timestamp: new Date().toISOString(),
      config,
      results: sorted,
      winner,
      insights: {
        bestModel,
        costSavings,
        fastestVariant,
        mostConsistent,
      },
      totalCost,
      totalTests: variants.length * config.models.length,
    };
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
