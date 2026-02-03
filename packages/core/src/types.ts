/**
 * Core types for EvoPrompt genetic algorithm
 */

export interface PromptGene {
  id: string;
  text: string;
  fitness: number;
  metrics: PromptMetrics;
  generation: number;
  parents?: string[];
}

export interface PromptMetrics {
  accuracy: number;      // Average judge score (0-10)
  cost: number;          // Total cost in USD
  speed: number;         // Tokens per second
  latency: number;       // Time to first token (ms)
}

export interface ModelResult {
  model: string;
  output: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  speed: number;
  latency: number;
  judgeScores: number[];
  averageScore: number;
}

export interface GenerationStats {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  diversity: number;
  bestPrompt: PromptGene;
  population: PromptGene[];
  timestamp: number;
}

export interface EvolutionResult {
  finalPrompt: PromptGene;
  history: GenerationStats[];
  improvement: {
    accuracy: number;    // Percentage improvement
    cost: number;        // Percentage reduction (negative = increase)
    speed: number;       // Percentage improvement
  };
  totalGenerations: number;
  totalEvaluations: number;
  totalCost: number;
}

export interface EvolverConfig {
  apiKey: string;
  judges: string[];           // Judge model IDs
  targetModels: string[];     // Models to optimize for
  populationSize?: number;    // Default: 10
  mutationRate?: number;      // Default: 0.3
  crossoverRate?: number;     // Default: 0.7
  elitismRate?: number;       // Default: 0.1
  fitnessWeights?: {
    accuracy: number;         // Default: 0.7
    cost: number;             // Default: 0.15
    speed: number;            // Default: 0.15
  };
  testCases?: string[];       // Optional test cases
  verbose?: boolean;          // Default: false
}

export interface MutationStrategy {
  name: string;
  prompt: string;
  weight: number;
}

export interface JudgeResult {
  judge: string;
  score: number;
  reasoning?: string;
  cost: number;
}

export type EventCallback = (data: any) => void;

export interface EventEmitter {
  on(event: 'generation', callback: EventCallback): void;
  on(event: 'evaluation', callback: EventCallback): void;
  on(event: 'mutation', callback: EventCallback): void;
  on(event: 'error', callback: EventCallback): void;
  emit(event: string, data: any): void;
}
