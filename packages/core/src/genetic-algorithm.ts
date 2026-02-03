/**
 * Genetic Algorithm implementation for prompt evolution
 */

import { PromptGene } from './types.js';

export class GeneticAlgorithm {
  private populationSize: number;
  private mutationRate: number;
  private crossoverRate: number;
  private elitismRate: number;

  constructor(config: {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    elitismRate: number;
  }) {
    this.populationSize = config.populationSize;
    this.mutationRate = config.mutationRate;
    this.crossoverRate = config.crossoverRate;
    this.elitismRate = config.elitismRate;
  }

  /**
   * Initialize population from seed prompt
   */
  initializePopulation(seedPrompt: string, generation: number = 0): PromptGene[] {
    const population: PromptGene[] = [];

    // Add seed prompt as first individual
    population.push({
      id: this.generateId(),
      text: seedPrompt,
      fitness: 0,
      metrics: { accuracy: 0, cost: 0, speed: 0, latency: 0 },
      generation,
      parents: []
    });

    // Fill rest with placeholder (will be mutated)
    for (let i = 1; i < this.populationSize; i++) {
      population.push({
        id: this.generateId(),
        text: seedPrompt,
        fitness: 0,
        metrics: { accuracy: 0, cost: 0, speed: 0, latency: 0 },
        generation,
        parents: []
      });
    }

    return population;
  }

  /**
   * Selection: Tournament selection
   */
  selectParents(population: PromptGene[], tournamentSize: number = 3): [PromptGene, PromptGene] {
    const select = () => {
      const tournament = [];
      for (let i = 0; i < tournamentSize; i++) {
        const randomIdx = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIdx]);
      }
      return tournament.reduce((best, current) =>
        current.fitness > best.fitness ? current : best
      );
    };

    return [select(), select()];
  }

  /**
   * Evolve population to next generation
   */
  evolvePopulation(
    population: PromptGene[],
    generation: number
  ): { elites: PromptGene[], toMutate: PromptGene[], toCrossover: [PromptGene, PromptGene][] } {
    // Sort by fitness
    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);

    // Elitism: keep top performers
    const eliteCount = Math.floor(this.populationSize * this.elitismRate);
    const elites = sorted.slice(0, eliteCount);

    // Determine how many offspring to create
    const offspringCount = this.populationSize - eliteCount;

    // Split between crossover and mutation
    const crossoverCount = Math.floor(offspringCount * this.crossoverRate);
    const mutationCount = offspringCount - crossoverCount;

    // Select parents for crossover
    const toCrossover: [PromptGene, PromptGene][] = [];
    for (let i = 0; i < Math.floor(crossoverCount / 2); i++) {
      toCrossover.push(this.selectParents(sorted));
    }

    // Select individuals for mutation
    const toMutate: PromptGene[] = [];
    for (let i = 0; i < mutationCount; i++) {
      const [parent] = this.selectParents(sorted);
      toMutate.push(parent);
    }

    return { elites, toMutate, toCrossover };
  }

  /**
   * Calculate population diversity (average Levenshtein distance)
   */
  calculateDiversity(population: PromptGene[]): number {
    if (population.length < 2) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < population.length; i++) {
      for (let j = i + 1; j < population.length; j++) {
        totalDistance += this.levenshteinDistance(
          population[i].text,
          population[j].text
        );
        comparisons++;
      }
    }

    return totalDistance / comparisons;
  }

  /**
   * Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Generate unique ID
   */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
