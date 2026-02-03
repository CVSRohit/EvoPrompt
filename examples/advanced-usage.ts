/**
 * Advanced usage example - Multi-objective optimization
 */

import { PromptEvolver } from '@evoprompt/core';
import { config } from 'dotenv';

config();

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY!;

  console.log('🧬 EvoPrompt - Advanced Usage Example\n');

  // Multi-judge ensemble for better evaluation
  const evolver = new PromptEvolver({
    apiKey,
    judges: ['gpt-4o', 'claude-3.5-sonnet', 'llama-3.3-70b'], // Jury of 3 judges
    targetModels: ['gpt-4o', 'claude-3.5-sonnet', 'llama-3.3-70b', 'qwen-2.5-72b'],
    populationSize: 12,
    mutationRate: 0.4,
    crossoverRate: 0.6,
    elitismRate: 0.2,
    fitnessWeights: {
      accuracy: 0.6,   // Prioritize accuracy
      cost: 0.25,      // Consider cost
      speed: 0.15,     // Less emphasis on speed
    },
    verbose: true,
  });

  // Track best prompts per generation
  const bestPrompts: string[] = [];

  evolver.on('generation', (stats) => {
    bestPrompts.push(stats.bestPrompt.text);
    console.log(
      `Gen ${stats.generation.toString().padStart(2, '0')}: ` +
      `Fitness=${stats.bestFitness.toFixed(4)} ` +
      `Accuracy=${stats.bestPrompt.metrics.accuracy.toFixed(2)}/10 ` +
      `Cost=$${stats.bestPrompt.metrics.cost.toFixed(4)} ` +
      `Diversity=${stats.diversity.toFixed(0)}`
    );
  });

  evolver.on('mutation', ({ parent, mutated }) => {
    console.log(`  → Mutated prompt (${mutated.text.length} chars)`);
  });

  const initialPrompt = 'Write a Python function to sort a list';

  console.log(`Initial: "${initialPrompt}"\n`);
  console.log('Evolving with multi-objective optimization...\n');

  const result = await evolver.evolve(initialPrompt, 20);

  console.log('\n' + '═'.repeat(60));
  console.log('FINAL OPTIMIZED PROMPT');
  console.log('═'.repeat(60));
  console.log(result.finalPrompt.text);
  console.log('═'.repeat(60));

  console.log('\n📊 Final Metrics:');
  console.log(`  Accuracy:    ${result.finalPrompt.metrics.accuracy.toFixed(2)}/10`);
  console.log(`  Cost:        $${result.finalPrompt.metrics.cost.toFixed(4)}`);
  console.log(`  Speed:       ${result.finalPrompt.metrics.speed.toFixed(0)} tok/s`);
  console.log(`  Fitness:     ${result.finalPrompt.fitness.toFixed(4)}`);

  console.log('\n📈 Improvements:');
  console.log(`  Accuracy:    ${result.improvement.accuracy > 0 ? '+' : ''}${result.improvement.accuracy.toFixed(1)}%`);
  console.log(`  Cost:        ${result.improvement.cost > 0 ? '+' : ''}${result.improvement.cost.toFixed(1)}%`);
  console.log(`  Speed:       ${result.improvement.speed > 0 ? '+' : ''}${result.improvement.speed.toFixed(1)}%`);

  console.log('\n💰 Total Cost: $' + result.totalCost.toFixed(4));

  // Show evolution path
  console.log('\n🌳 Evolution Path (first 5 generations):');
  bestPrompts.slice(0, 5).forEach((prompt, i) => {
    console.log(`  Gen ${i}: ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}`);
  });
}

main().catch(console.error);
