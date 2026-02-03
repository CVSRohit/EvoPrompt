/**
 * Display utilities for CLI output
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import type { GenerationStats, EvolutionResult } from 'evoprompt-core';

export function renderEvolutionProgress(stats: GenerationStats): string {
  const gen = stats.generation.toString().padStart(3, '0');
  const best = stats.bestFitness.toFixed(3);
  const avg = stats.avgFitness.toFixed(3);
  const div = stats.diversity.toFixed(0);

  return `Gen ${gen} | Best: ${best} | Avg: ${avg} | Diversity: ${div}`;
}

export function renderFinalResults(result: EvolutionResult): void {
  console.log(chalk.bold.green('🎉 Optimized Prompt:\n'));
  console.log(chalk.white('━'.repeat(60)));
  console.log(chalk.yellow(result.finalPrompt.text));
  console.log(chalk.white('━'.repeat(60) + '\n'));

  // Metrics table
  const metricsTable = new Table({
    head: [chalk.cyan('Metric'), chalk.cyan('Initial'), chalk.cyan('Final'), chalk.cyan('Change')],
  });

  const initial = result.history[0].bestPrompt;
  const final = result.finalPrompt;

  metricsTable.push(
    [
      'Accuracy',
      chalk.white(initial.metrics.accuracy.toFixed(2) + '/10'),
      chalk.green(final.metrics.accuracy.toFixed(2) + '/10'),
      formatChange(result.improvement.accuracy, '%', true)
    ],
    [
      'Cost',
      chalk.white('$' + initial.metrics.cost.toFixed(4)),
      chalk.green('$' + final.metrics.cost.toFixed(4)),
      formatChange(result.improvement.cost, '%', true)
    ],
    [
      'Speed',
      chalk.white(initial.metrics.speed.toFixed(0) + ' tok/s'),
      chalk.green(final.metrics.speed.toFixed(0) + ' tok/s'),
      formatChange(result.improvement.speed, '%', true)
    ]
  );

  console.log(chalk.bold.cyan('📊 Metrics:\n'));
  console.log(metricsTable.toString());
  console.log();

  // Summary stats
  console.log(chalk.bold.cyan('📈 Summary:\n'));
  console.log(chalk.white(`  Generations:  ${chalk.cyan(result.totalGenerations)}`));
  console.log(chalk.white(`  Evaluations:  ${chalk.cyan(result.totalEvaluations)}`));
  console.log(chalk.white(`  Total Cost:   ${chalk.yellow('$' + result.totalCost.toFixed(4))}`));
  console.log(chalk.white(`  Final Fitness: ${chalk.green(final.fitness.toFixed(4))}`));
  console.log();

  // Evolution chart (simple ASCII)
  console.log(chalk.bold.cyan('📉 Evolution Progress:\n'));
  renderEvolutionChart(result.history);
  console.log();
}

function renderEvolutionChart(history: GenerationStats[]): void {
  const height = 10;
  const width = Math.min(60, history.length);
  const step = Math.max(1, Math.floor(history.length / width));

  const values = history.filter((_, i) => i % step === 0).map(h => h.bestFitness);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const chart: string[][] = Array(height).fill(0).map(() => Array(width).fill(' '));

  values.forEach((value, x) => {
    const y = Math.floor(((value - min) / range) * (height - 1));
    const displayY = height - 1 - y; // Invert Y axis
    if (chart[displayY] && chart[displayY][x] !== undefined) {
      chart[displayY][x] = '█';
    }
  });

  console.log(chalk.gray('  ' + max.toFixed(3) + ' │'));
  chart.forEach((row, i) => {
    const marker = i === 0 ? '┤' : i === height - 1 ? '┤' : '│';
    console.log(chalk.gray('        ' + marker) + chalk.green(row.join('')));
  });
  console.log(chalk.gray('  ' + min.toFixed(3) + ' └' + '─'.repeat(width)));
  console.log(chalk.gray('         0' + ' '.repeat(width - 10) + 'Generation'));
}

function formatChange(value: number, suffix: string, higherIsBetter: boolean): string {
  if (isNaN(value) || !isFinite(value)) {
    return chalk.gray('N/A');
  }

  const sign = value >= 0 ? '+' : '';
  const color = (value >= 0 && higherIsBetter) || (value < 0 && !higherIsBetter)
    ? chalk.green
    : chalk.red;

  return color(`${sign}${value.toFixed(1)}${suffix}`);
}
