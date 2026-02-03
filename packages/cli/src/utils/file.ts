/**
 * File utilities for saving results
 */

import { writeFile } from 'fs/promises';
import type { EvolutionResult } from '@evoprompt/core';

export async function saveResults(result: EvolutionResult, filepath: string): Promise<void> {
  const data = {
    finalPrompt: result.finalPrompt.text,
    metrics: result.finalPrompt.metrics,
    improvement: result.improvement,
    summary: {
      generations: result.totalGenerations,
      evaluations: result.totalEvaluations,
      totalCost: result.totalCost,
    },
    history: result.history.map(gen => ({
      generation: gen.generation,
      bestFitness: gen.bestFitness,
      avgFitness: gen.avgFitness,
      diversity: gen.diversity,
      bestPrompt: gen.bestPrompt.text,
    })),
    timestamp: new Date().toISOString(),
  };

  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}
