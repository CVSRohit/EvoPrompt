#!/usr/bin/env node

/**
 * EvoPrompt CLI - Command-line interface for prompt evolution
 */

import { Command } from 'commander';
import { config } from 'dotenv';
import { optimizeCommand } from './commands/optimize.js';
import { compareCommand } from './commands/compare.js';
import { swarmCommand } from './commands/swarm.js';

// Load environment variables
config();

const program = new Command();

program
  .name('evoprompt')
  .description('🧬 Evolve your prompts to perfection using genetic algorithms')
  .version('1.0.0');

// Optimize command
program
  .command('optimize')
  .description('Optimize a prompt using genetic evolution')
  .argument('<prompt>', 'Initial prompt to optimize')
  .option('-m, --models <models...>', 'Target models to optimize for', ['gpt-4o', 'claude-3.5-sonnet'])
  .option('-j, --judges <judges...>', 'Judge models for evaluation', ['gpt-4o'])
  .option('-g, --generations <number>', 'Number of generations', '30')
  .option('-p, --population <number>', 'Population size', '10')
  .option('--mutation-rate <rate>', 'Mutation rate (0-1)', '0.3')
  .option('--crossover-rate <rate>', 'Crossover rate (0-1)', '0.7')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-o, --output <file>', 'Save results to JSON file')
  .action(optimizeCommand);

// Swarm command
program
  .command('swarm')
  .description('Test multiple prompt variants in parallel (A/B testing)')
  .argument('<prompt>', 'Base prompt to test')
  .option('-m, --models <models...>', 'Models to test (use "free" for free models)', 'free')
  .option('-j, --judges <judges...>', 'Judge models', ['openai/gpt-4o-mini'])
  .option('--variants <file>', 'JSON file with prompt variants')
  .option('--auto-variants <number>', 'Auto-generate N variants', '10')
  .option('--parallel <number>', 'Max parallel executions', '5')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-o, --output <file>', 'Save results to JSON file')
  .action(swarmCommand);

// Compare command
program
  .command('compare')
  .description('Compare a prompt across multiple models')
  .argument('<prompt>', 'Prompt to test')
  .option('-m, --models <models...>', 'Models to compare', ['gpt-4o', 'claude-3.5-sonnet', 'llama-3.3-70b'])
  .option('-j, --judges <judges...>', 'Judge models', ['gpt-4o'])
  .option('-v, --verbose', 'Verbose output', false)
  .action(compareCommand);

// List models command
program
  .command('models')
  .description('List available models')
  .action(() => {
    console.log('\n🤖 Popular Models:\n');
    console.log('Judges (Recommended):');
    console.log('  - gpt-4o              (OpenAI, best quality)');
    console.log('  - claude-opus-4.5     (Anthropic, highest quality)');
    console.log('  - claude-3.5-sonnet   (Anthropic, great balance)');
    console.log('  - llama-3.3-70b       (Meta, open source)');
    console.log('\nTarget Models:');
    console.log('  - gpt-4o              (OpenAI)');
    console.log('  - gpt-4-turbo         (OpenAI)');
    console.log('  - claude-3.5-sonnet   (Anthropic)');
    console.log('  - claude-opus-4.5     (Anthropic)');
    console.log('  - llama-3.3-70b       (Meta)');
    console.log('  - qwen-2.5-72b        (Alibaba)');
    console.log('  - gemini-2.0-pro      (Google)');
    console.log('\nFree Models (for Swarm):');
    console.log('  - meta-llama/llama-3.3-70b-instruct');
    console.log('  - qwen/qwen-2.5-72b-instruct');
    console.log('  - google/gemma-2-27b-it');
    console.log('  - mistralai/mistral-7b-instruct-v0.3');
    console.log('\nSee all models at: https://openrouter.ai/models\n');
  });

program.parse();
