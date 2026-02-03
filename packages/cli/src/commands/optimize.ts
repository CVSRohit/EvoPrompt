/**
 * Optimize command - evolve a prompt using genetic algorithms
 */

import { PromptEvolver } from 'evoprompt-core';
import ora from 'ora';
import chalk from 'chalk';
import { renderEvolutionProgress, renderFinalResults } from '../utils/display.js';
import { saveResults } from '../utils/file.js';
import type { GenerationStats } from 'evoprompt-core';

interface OptimizeOptions {
  models: string[];
  judges: string[];
  generations: string;
  population: string;
  mutationRate: string;
  crossoverRate: string;
  verbose: boolean;
  output?: string;
}

export async function optimizeCommand(prompt: string, options: OptimizeOptions) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error(chalk.red('\n❌ Error: OPENROUTER_API_KEY not found in environment'));
    console.log(chalk.yellow('   Please set your API key:'));
    console.log(chalk.white('   export OPENROUTER_API_KEY=your_key_here\n'));
    console.log(chalk.gray('   Get your key at: https://openrouter.ai/keys\n'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n🧬 EvoPrompt - Genetic Prompt Evolution\n'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log(chalk.white(`Initial prompt: ${chalk.yellow(prompt)}`));
  console.log(chalk.white(`Target models: ${chalk.green(options.models.join(', '))}`));
  console.log(chalk.white(`Judge models: ${chalk.blue(options.judges.join(', '))}`));
  console.log(chalk.white(`Generations: ${chalk.cyan(options.generations)}`));
  console.log(chalk.white(`Population: ${chalk.cyan(options.population)}`));
  console.log(chalk.gray('━'.repeat(60) + '\n'));

  const spinner = ora('Initializing evolution engine...').start();

  try {
    const evolver = new PromptEvolver({
      apiKey,
      judges: options.judges,
      targetModels: options.models,
      populationSize: parseInt(options.population),
      mutationRate: parseFloat(options.mutationRate),
      crossoverRate: parseFloat(options.crossoverRate),
      verbose: options.verbose,
    });

    let currentGen = 0;
    let lastStats: GenerationStats | null = null;

    // Listen to generation events
    evolver.on('generation', (stats: GenerationStats) => {
      currentGen = stats.generation;
      lastStats = stats;
      spinner.text = renderEvolutionProgress(stats);
    });

    spinner.text = 'Starting evolution...';

    const result = await evolver.evolve(
      prompt,
      parseInt(options.generations)
    );

    spinner.succeed(chalk.green('Evolution complete! 🎉\n'));

    // Display final results
    renderFinalResults(result);

    // Save to file if requested
    if (options.output) {
      await saveResults(result, options.output);
      console.log(chalk.green(`\n✅ Results saved to ${options.output}\n`));
    }

  } catch (error: any) {
    spinner.fail(chalk.red('Evolution failed'));
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
