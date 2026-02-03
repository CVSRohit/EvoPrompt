/**
 * Types for Swarm testing (parallel prompt testing)
 */

export interface PromptVariant {
  name: string;
  prompt: string;
  strategy?: string;
}

export interface SwarmConfig {
  basePrompt: string;
  variants: PromptVariant[];
  models: string[];
  judge: string;
  parallelLimit?: number;
  autoGenerate?: boolean;
  numVariants?: number;
  verbose?: boolean;
}

export interface SwarmTestResult {
  variant: string;
  prompt: string;
  model: string;
  output: string;
  score: number;
  cost: number;
  latency: number;
  speed: number;
}

export interface SwarmVariantResult {
  variant: string;
  prompt: string;
  scoresByModel: Map<string, SwarmTestResult>;
  avgScore: number;
  totalCost: number;
  avgLatency: number;
  avgSpeed: number;
}

export interface SwarmResult {
  timestamp: string;
  config: SwarmConfig;
  results: SwarmVariantResult[];
  winner: SwarmVariantResult;
  insights: {
    bestModel: string;
    costSavings: number;
    fastestVariant: string;
    mostConsistent: string;
  };
  totalCost: number;
  totalTests: number;
}

export interface TestCase {
  variant: PromptVariant;
  model: string;
}

export const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen-2.5-72b-instruct',
  'google/gemma-2-27b-it',
  'mistralai/mistral-7b-instruct-v0.3',
];

export const CHEAP_MODELS = [
  'openai/gpt-4o-mini',
  'anthropic/claude-3-haiku',
  'google/gemini-flash-1.5',
];

export const MUTATION_STRATEGIES = [
  'Be more concise and direct',
  'Add specific examples and demonstrations',
  'Include step-by-step instructions',
  'Add constraints and requirements',
  'Make it more detailed and comprehensive',
  'Use analogies and metaphors',
  'Focus on technical accuracy',
  'Simplify for beginners',
  'Add context and background information',
  'Make it more structured with bullet points',
];
