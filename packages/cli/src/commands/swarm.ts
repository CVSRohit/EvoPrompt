/**
 * Swarm command - parallel prompt testing with multiple variants and models
 */

import { SwarmTester, FREE_MODELS, type PromptVariant } from 'evoprompt-core';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { writeFile, readFile } from 'fs/promises';

interface SwarmOptions {
  models: string | string[];
  judges: string[];
  variants?: string;
  autoVariants?: string;
  parallel: string;
  verbose: boolean;
  output?: string;
}

export async function swarmCommand(prompt: string, options: SwarmOptions) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error(chalk.red('\n❌ Error: OPENROUTER_API_KEY not found in environment'));
    console.log(chalk.yellow('   Please set your API key:'));
    console.log(chalk.white('   export OPENROUTER_API_KEY=your_key_here\n'));
    console.log(chalk.gray('   Get your key at: https://openrouter.ai/keys\n'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n🐝 EvoPrompt Swarm - Parallel Prompt Testing\n'));

  // Parse models
  const models = options.models === 'free'
    ? FREE_MODELS
    : Array.isArray(options.models)
    ? options.models
    : [options.models];

  // Load variants if file provided
  let variants: PromptVariant[] | undefined;
  if (options.variants) {
    try {
      const content = await readFile(options.variants, 'utf-8');
      const data = JSON.parse(content);
      variants = data.variants || data;
    } catch (error: any) {
      console.error(chalk.red(`Failed to load variants from ${options.variants}: ${error.message}`));
      process.exit(1);
    }
  }

  const numVariants = options.autoVariants ? parseInt(options.autoVariants) : 10;
  const parallelLimit = parseInt(options.parallel);

  console.log(chalk.gray('━'.repeat(60)));
  console.log(chalk.white(`Base prompt: ${chalk.yellow(prompt)}`));
  console.log(chalk.white(`Models: ${chalk.green(models.join(', '))}`));
  console.log(chalk.white(`Judge: ${chalk.blue(options.judges[0])}`));

  if (variants) {
    console.log(chalk.white(`Variants: ${chalk.cyan(variants.length)} (from file)`));
  } else {
    console.log(chalk.white(`Auto-generating: ${chalk.cyan(numVariants)} variants`));
  }

  console.log(chalk.white(`Parallel limit: ${chalk.cyan(parallelLimit)}`));
  console.log(chalk.gray('━'.repeat(60) + '\n'));

  const spinner = ora('Initializing swarm tester...').start();

  try {
    const swarmTester = new SwarmTester({
      apiKey,
      judge: options.judges[0],
      models,
      parallelLimit,
      verbose: options.verbose,
      basePrompt: prompt,
      variants: variants || [],
      autoGenerate: !variants,
      numVariants,
    });

    let testsCompleted = 0;
    let totalTests = 0;

    // Listen to events
    swarmTester.on('start', (data: any) => {
      totalTests = data.variantsCount * data.modelsCount;
      spinner.text = `Running ${totalTests} tests...`;
    });

    swarmTester.on('progress', (data: any) => {
      testsCompleted = data.completed;
      const percent = ((testsCompleted / totalTests) * 100).toFixed(0);
      spinner.text = `Progress: ${testsCompleted}/${totalTests} (${percent}%) - Testing ${data.variant} on ${data.model}`;
    });

    const result = await swarmTester.testSwarm();

    spinner.succeed(chalk.green('Swarm test complete! 🎉\n'));

    // Display results
    console.log(chalk.bold.green('🏆 Results Summary:\n'));

    // Create results table
    const table = new Table({
      head: [
        chalk.cyan('Variant'),
        chalk.cyan('Avg Score'),
        chalk.cyan('Cost'),
        chalk.cyan('Speed'),
        chalk.cyan('Winner?')
      ],
      colWidths: [20, 12, 12, 12, 10]
    });

    for (const variant of result.results.slice(0, 10)) {
      const isWinner = variant.variant === result.winner.variant;
      table.push([
        isWinner ? chalk.bold(variant.variant) : variant.variant,
        chalk.green(`${variant.avgScore.toFixed(1)}/10`),
        chalk.yellow(`$${variant.totalCost.toFixed(4)}`),
        chalk.blue(`${variant.avgSpeed.toFixed(0)} t/s`),
        isWinner ? chalk.yellow('★') : ''
      ]);
    }

    console.log(table.toString());
    console.log();

    // Display insights
    console.log(chalk.bold.cyan('📊 Insights:\n'));
    console.log(chalk.white(`  Best Model:        ${chalk.green(result.insights.bestModel)}`));
    console.log(chalk.white(`  Fastest Variant:   ${chalk.blue(result.insights.fastestVariant)}`));
    console.log(chalk.white(`  Most Consistent:   ${chalk.magenta(result.insights.mostConsistent)}`));
    console.log(chalk.white(`  Cost Savings:      ${chalk.yellow(`${result.insights.costSavings.toFixed(0)}%`)} vs paid models`));
    console.log();

    console.log(chalk.bold.cyan('💰 Cost:\n'));
    console.log(chalk.white(`  Total:             ${chalk.yellow(`$${result.totalCost.toFixed(4)}`)}`));
    console.log(chalk.white(`  Per Test:          ${chalk.yellow(`$${(result.totalCost / result.totalTests).toFixed(6)}`)}`));
    console.log();

    // Show winner prompt
    console.log(chalk.bold.green('✨ Winner:\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.yellow(result.winner.prompt));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.white(`\nScore: ${chalk.green(result.winner.avgScore.toFixed(1) + '/10')}`));
    console.log();

    // Save to file if requested
    if (options.output) {
      const outputData = {
        timestamp: result.timestamp,
        basePrompt: prompt,
        winner: {
          variant: result.winner.variant,
          prompt: result.winner.prompt,
          avgScore: result.winner.avgScore,
          totalCost: result.winner.totalCost,
        },
        results: result.results.map(r => ({
          variant: r.variant,
          prompt: r.prompt,
          avgScore: r.avgScore,
          totalCost: r.totalCost,
          avgLatency: r.avgLatency,
          avgSpeed: r.avgSpeed,
        })),
        insights: result.insights,
        totalCost: result.totalCost,
        totalTests: result.totalTests,
      };

      await writeFile(options.output, JSON.stringify(outputData, null, 2), 'utf-8');
      console.log(chalk.green(`✅ Results saved to ${options.output}\n`));
    }

  } catch (error: any) {
    spinner.fail(chalk.red('Swarm test failed'));
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
