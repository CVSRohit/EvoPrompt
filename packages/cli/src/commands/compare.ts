/**
 * Compare command - test a prompt across multiple models
 */

import { PromptEvolver } from '@evoprompt/core';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';

interface CompareOptions {
  models: string[];
  judges: string[];
  verbose: boolean;
}

export async function compareCommand(prompt: string, options: CompareOptions) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error(chalk.red('\n❌ Error: OPENROUTER_API_KEY not found in environment'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n🔍 EvoPrompt - Model Comparison\n'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log(chalk.white(`Prompt: ${chalk.yellow(prompt)}`));
  console.log(chalk.white(`Models: ${chalk.green(options.models.join(', '))}`));
  console.log(chalk.gray('━'.repeat(60) + '\n'));

  const spinner = ora('Running prompt across models...').start();

  try {
    const evolver = new PromptEvolver({
      apiKey,
      judges: options.judges,
      targetModels: options.models,
      populationSize: 1,
      verbose: options.verbose,
    });

    // Run single evaluation (no evolution)
    const result = await evolver.evolve(prompt, 1);

    spinner.succeed(chalk.green('Comparison complete!\n'));

    // Display results in table
    const table = new Table({
      head: [
        chalk.cyan('Model'),
        chalk.cyan('Accuracy'),
        chalk.cyan('Cost'),
        chalk.cyan('Speed'),
        chalk.cyan('Latency')
      ],
      colWidths: [25, 12, 12, 12, 12]
    });

    const stats = result.history[0];

    for (const gene of stats.population) {
      table.push([
        gene.text.substring(0, 20) + '...',
        chalk.green(gene.metrics.accuracy.toFixed(2) + '/10'),
        chalk.yellow('$' + gene.metrics.cost.toFixed(4)),
        chalk.blue(gene.metrics.speed.toFixed(0) + ' tok/s'),
        chalk.magenta(gene.metrics.latency.toFixed(0) + ' ms')
      ]);
    }

    console.log(table.toString());
    console.log();

  } catch (error: any) {
    spinner.fail(chalk.red('Comparison failed'));
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}
