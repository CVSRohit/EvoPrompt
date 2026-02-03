/**
 * Main PromptEvolver class that orchestrates genetic algorithm and LLM evaluation
 */

import { GeneticAlgorithm } from './genetic-algorithm.js';
import { OpenRouterClient } from './openrouter-client.js';
import type {
  EvolverConfig,
  PromptGene,
  GenerationStats,
  EvolutionResult,
  EventCallback,
  MutationStrategy,
  ModelResult
} from './types.js';

export class PromptEvolver {
  private ga: GeneticAlgorithm;
  private client: OpenRouterClient;
  private config: Required<EvolverConfig>;
  private eventHandlers: Map<string, EventCallback[]> = new Map();

  private static MUTATION_STRATEGIES: MutationStrategy[] = [
    { name: 'add_detail', prompt: 'Add more specific details and examples to this prompt', weight: 1 },
    { name: 'simplify', prompt: 'Simplify this prompt while keeping its core intent', weight: 1 },
    { name: 'add_structure', prompt: 'Add clear structure and formatting instructions to this prompt', weight: 1 },
    { name: 'add_constraints', prompt: 'Add helpful constraints and requirements to this prompt', weight: 1 },
    { name: 'add_examples', prompt: 'Add examples or demonstrations to this prompt', weight: 1 },
    { name: 'clarify', prompt: 'Make this prompt more clear and unambiguous', weight: 1 },
    { name: 'strengthen', prompt: 'Make this prompt more assertive and directive', weight: 0.5 },
  ];

  constructor(config: EvolverConfig) {
    // Set defaults
    this.config = {
      ...config,
      populationSize: config.populationSize ?? 10,
      mutationRate: config.mutationRate ?? 0.3,
      crossoverRate: config.crossoverRate ?? 0.7,
      elitismRate: config.elitismRate ?? 0.1,
      fitnessWeights: config.fitnessWeights ?? {
        accuracy: 0.7,
        cost: 0.15,
        speed: 0.15,
      },
      testCases: config.testCases ?? [],
      verbose: config.verbose ?? false,
    };

    this.ga = new GeneticAlgorithm({
      populationSize: this.config.populationSize,
      mutationRate: this.config.mutationRate,
      crossoverRate: this.config.crossoverRate,
      elitismRate: this.config.elitismRate,
    });

    this.client = new OpenRouterClient(this.config.apiKey, this.config.verbose);
  }

  /**
   * Main evolution loop
   */
  async evolve(
    initialPrompt: string,
    generations: number = 50
  ): Promise<EvolutionResult> {
    const history: GenerationStats[] = [];
    let population = this.ga.initializePopulation(initialPrompt, 0);
    let totalEvaluations = 0;
    let totalCost = 0;

    // Initial evaluation
    population = await this.evaluatePopulation(population, 0);
    totalEvaluations += population.length;

    for (let gen = 0; gen < generations; gen++) {
      // Record statistics
      const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
      const avgFitness = population.reduce((sum, p) => sum + p.fitness, 0) / population.length;
      const diversity = this.ga.calculateDiversity(population);

      const stats: GenerationStats = {
        generation: gen,
        bestFitness: sorted[0].fitness,
        avgFitness,
        diversity,
        bestPrompt: sorted[0],
        population: sorted,
        timestamp: Date.now(),
      };

      history.push(stats);
      this.emit('generation', stats);

      if (this.config.verbose) {
        console.log(`Gen ${gen}: Best=${sorted[0].fitness.toFixed(3)} Avg=${avgFitness.toFixed(3)} Diversity=${diversity.toFixed(0)}`);
      }

      // Check for convergence
      if (gen > 10 && this.hasConverged(history.slice(-5))) {
        if (this.config.verbose) {
          console.log('Population converged. Stopping early.');
        }
        break;
      }

      // Evolve to next generation
      const { elites, toMutate, toCrossover } = this.ga.evolvePopulation(population, gen + 1);

      const nextGen: PromptGene[] = [...elites];

      // Perform mutations
      for (const parent of toMutate) {
        try {
          const mutated = await this.mutate(parent, gen + 1);
          nextGen.push(mutated);
          this.emit('mutation', { parent, mutated });
        } catch (error) {
          if (this.config.verbose) {
            console.error('Mutation failed:', error);
          }
          nextGen.push({ ...parent, generation: gen + 1 });
        }
      }

      // Perform crossovers
      for (const [parent1, parent2] of toCrossover) {
        try {
          const child1 = await this.crossover(parent1, parent2, gen + 1);
          nextGen.push(child1);

          if (nextGen.length < this.config.populationSize) {
            const child2 = await this.crossover(parent2, parent1, gen + 1);
            nextGen.push(child2);
          }
        } catch (error) {
          if (this.config.verbose) {
            console.error('Crossover failed:', error);
          }
          nextGen.push({ ...parent1, generation: gen + 1 });
        }
      }

      // Evaluate new individuals
      const newIndividuals = nextGen.slice(elites.length);
      const evaluated = await this.evaluatePopulation(newIndividuals, gen + 1);
      totalEvaluations += evaluated.length;

      population = [...elites, ...evaluated];

      // Track total cost
      totalCost += population.reduce((sum, p) => sum + p.metrics.cost, 0);
    }

    // Calculate improvement
    const finalSorted = [...population].sort((a, b) => b.fitness - a.fitness);
    const initial = history[0].bestPrompt;
    const final = finalSorted[0];

    const improvement = {
      accuracy: ((final.metrics.accuracy - initial.metrics.accuracy) / initial.metrics.accuracy) * 100,
      cost: ((initial.metrics.cost - final.metrics.cost) / initial.metrics.cost) * 100,
      speed: ((final.metrics.speed - initial.metrics.speed) / initial.metrics.speed) * 100,
    };

    return {
      finalPrompt: final,
      history,
      improvement,
      totalGenerations: history.length,
      totalEvaluations,
      totalCost,
    };
  }

  /**
   * Evaluate fitness of entire population
   */
  private async evaluatePopulation(
    population: PromptGene[],
    generation: number
  ): Promise<PromptGene[]> {
    const evaluated = await Promise.all(
      population.map(async (gene) => {
        try {
          return await this.evaluatePrompt(gene);
        } catch (error) {
          if (this.config.verbose) {
            console.error('Evaluation failed:', error);
          }
          return gene;
        }
      })
    );

    return evaluated;
  }

  /**
   * Evaluate a single prompt across all target models
   */
  private async evaluatePrompt(gene: PromptGene): Promise<PromptGene> {
    const results: ModelResult[] = [];

    // Run prompt on all target models
    for (const model of this.config.targetModels) {
      try {
        const result = await this.client.runPrompt(model, gene.text);

        // Judge the output
        const judgeScores = await Promise.all(
          this.config.judges.map(judge =>
            this.client.judgeOutput(judge, result.output)
          )
        );

        result.judgeScores = judgeScores.map(j => j.score);
        result.averageScore = judgeScores.reduce((sum, j) => sum + j.score, 0) / judgeScores.length;

        results.push(result);

        this.emit('evaluation', { gene, model, result });
      } catch (error) {
        if (this.config.verbose) {
          console.error(`Failed to evaluate on ${model}:`, error);
        }
      }
    }

    if (results.length === 0) {
      return gene;
    }

    // Aggregate metrics
    const avgAccuracy = results.reduce((sum, r) => sum + r.averageScore, 0) / results.length;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const avgSpeed = results.reduce((sum, r) => sum + r.speed, 0) / results.length;
    const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;

    gene.metrics = {
      accuracy: avgAccuracy,
      cost: totalCost,
      speed: avgSpeed,
      latency: avgLatency,
    };

    // Calculate multi-objective fitness
    gene.fitness = this.calculateFitness(gene);

    return gene;
  }

  /**
   * Calculate fitness from metrics (multi-objective)
   */
  private calculateFitness(gene: PromptGene): number {
    const { accuracy, cost, speed } = gene.metrics;
    const weights = this.config.fitnessWeights;

    // Normalize metrics (0-1 scale)
    const normAccuracy = accuracy / 10; // Already 0-10
    const normCost = Math.max(0, 1 - cost / 0.1); // Lower cost is better, cap at $0.10
    const normSpeed = Math.min(1, speed / 100); // Normalize to 0-1, cap at 100 tok/s

    return (
      weights.accuracy * normAccuracy +
      weights.cost * normCost +
      weights.speed * normSpeed
    );
  }

  /**
   * Mutate a prompt using LLM
   */
  private async mutate(parent: PromptGene, generation: number): Promise<PromptGene> {
    const strategy = this.selectMutationStrategy();
    const mutatedText = await this.client.mutatePrompt(parent.text, strategy.prompt);

    return {
      id: this.ga.generateId(),
      text: mutatedText,
      fitness: 0,
      metrics: { accuracy: 0, cost: 0, speed: 0, latency: 0 },
      generation,
      parents: [parent.id],
    };
  }

  /**
   * Crossover two prompts using LLM
   */
  private async crossover(
    parent1: PromptGene,
    parent2: PromptGene,
    generation: number
  ): Promise<PromptGene> {
    const childText = await this.client.crossoverPrompts(parent1.text, parent2.text);

    return {
      id: this.ga.generateId(),
      text: childText,
      fitness: 0,
      metrics: { accuracy: 0, cost: 0, speed: 0, latency: 0 },
      generation,
      parents: [parent1.id, parent2.id],
    };
  }

  /**
   * Select mutation strategy (weighted random)
   */
  private selectMutationStrategy(): MutationStrategy {
    const totalWeight = PromptEvolver.MUTATION_STRATEGIES.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const strategy of PromptEvolver.MUTATION_STRATEGIES) {
      random -= strategy.weight;
      if (random <= 0) {
        return strategy;
      }
    }

    return PromptEvolver.MUTATION_STRATEGIES[0];
  }

  /**
   * Check if population has converged
   */
  private hasConverged(recentHistory: GenerationStats[]): boolean {
    if (recentHistory.length < 5) return false;

    const fitnesses = recentHistory.map(h => h.bestFitness);
    const variance = this.variance(fitnesses);

    return variance < 0.001; // Very low variance means convergence
  }

  /**
   * Calculate variance
   */
  private variance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
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
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
