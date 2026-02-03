/**
 * Basic usage example for EvoPrompt
 */

import { PromptEvolver } from '@evoprompt/core';
import { config } from 'dotenv';

// Load environment variables
config();

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('Error: OPENROUTER_API_KEY not found');
    console.log('Get your API key at: https://openrouter.ai/keys');
    process.exit(1);
  }

  console.log('🧬 EvoPrompt - Basic Usage Example\n');

  // Create evolver instance
  const evolver = new PromptEvolver({
    apiKey,
    judges: ['gpt-4o'],                           // Judge model
    targetModels: ['gpt-4o', 'claude-3.5-sonnet'], // Models to optimize for
    populationSize: 6,                             // Small population for demo
    mutationRate: 0.3,
    crossoverRate: 0.7,
    verbose: true,                                 // Show progress
  });

  // Listen to events
  evolver.on('generation', (stats) => {
    console.log(
      `Gen ${stats.generation}: ` +
      `Best=${stats.bestFitness.toFixed(3)} ` +
      `Avg=${stats.avgFitness.toFixed(3)}`
    );
  });

  // Initial prompt (intentionally basic)
  const initialPrompt = 'Explain quantum computing';

  console.log(`Initial prompt: "${initialPrompt}"\n`);
  console.log('Starting evolution...\n');

  try {
    const result = await evolver.evolve(initialPrompt, 10); // 10 generations

    console.log('\n✅ Evolution complete!\n');
    console.log('━'.repeat(60));
    console.log('Optimized Prompt:');
    console.log('━'.repeat(60));
    console.log(result.finalPrompt.text);
    console.log('━'.repeat(60));
    console.log('\nImprovements:');
    console.log(`  Accuracy: +${result.improvement.accuracy.toFixed(1)}%`);
    console.log(`  Cost:     ${result.improvement.cost.toFixed(1)}%`);
    console.log(`  Speed:    +${result.improvement.speed.toFixed(1)}%`);
    console.log(`\nTotal Cost: $${result.totalCost.toFixed(4)}`);
    console.log(`Generations: ${result.totalGenerations}`);
    console.log(`Evaluations: ${result.totalEvaluations}\n`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
