/**
 * EvoPrompt Core - Genetic algorithm engine for prompt evolution
 */

export { PromptEvolver } from './prompt-evolver.js';
export { GeneticAlgorithm } from './genetic-algorithm.js';
export { OpenRouterClient } from './openrouter-client.js';
export { SwarmTester } from './swarm-tester.js';

export type {
  PromptGene,
  PromptMetrics,
  ModelResult,
  GenerationStats,
  EvolutionResult,
  EvolverConfig,
  MutationStrategy,
  JudgeResult,
  EventCallback,
} from './types.js';

export type {
  SwarmConfig,
  SwarmResult,
  SwarmTestResult,
  SwarmVariantResult,
  PromptVariant,
} from './swarm-types.js';

export { FREE_MODELS, CHEAP_MODELS } from './swarm-types.js';
