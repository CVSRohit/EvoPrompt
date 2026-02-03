# evoprompt-core

Core genetic algorithm engine for prompt evolution. Use this library to programmatically optimize prompts in your TypeScript/JavaScript applications.

## Installation

```bash
npm install evoprompt-core
```

## Quick Start

### Genetic Evolution

```typescript
import { PromptEvolver } from 'evoprompt-core';

const evolver = new PromptEvolver({
  apiKey: process.env.OPENROUTER_API_KEY,
  initialPrompt: 'Explain quantum computing',
  targetModels: ['gpt-4o', 'claude-3.5-sonnet'],
  judgeModel: 'gpt-4o',
  populationSize: 10,
  generations: 30,
});

// Listen to progress
evolver.on('generation', (stats) => {
  console.log(`Generation ${stats.generation}: Best score ${stats.bestScore}`);
});

// Run evolution
const result = await evolver.evolve();
console.log('Final prompt:', result.finalPrompt.text);
console.log('Score improvement:', result.improvement);
```

### Swarm Testing (Parallel A/B)

```typescript
import { SwarmTester, FREE_MODELS } from 'evoprompt-core';

const swarm = new SwarmTester({
  apiKey: process.env.OPENROUTER_API_KEY,
  basePrompt: 'Explain AI',
  models: FREE_MODELS,
  judge: 'openai/gpt-4o-mini',
  autoGenerate: true,
  numVariants: 10,
  parallelLimit: 5,
});

// Listen to events
swarm.on('progress', (data) => {
  console.log(`Testing ${data.variant} on ${data.model}`);
});

const result = await swarm.testSwarm();
console.log('Winner:', result.winner.prompt);
console.log('Score:', result.winner.avgScore);
console.log('Cost:', result.totalCost);
```

## API Reference

### PromptEvolver

Main class for genetic algorithm-based prompt optimization.

**Constructor Options:**
- `apiKey` (required): OpenRouter API key
- `initialPrompt` (required): Starting prompt
- `targetModels`: Models to optimize for (default: ['gpt-4o'])
- `judgeModel`: Model for evaluation (default: 'gpt-4o')
- `populationSize`: Number of prompts per generation (default: 10)
- `generations`: Number of generations to evolve (default: 30)
- `mutationRate`: Probability of mutation (default: 0.3)
- `crossoverRate`: Probability of crossover (default: 0.7)
- `eliteCount`: Number of top prompts to preserve (default: 2)

**Methods:**
- `evolve()`: Run genetic algorithm, returns EvolutionResult
- `on(event, callback)`: Listen to events (generation, complete, error)

### SwarmTester

Class for parallel prompt testing across multiple models.

**Constructor Options:**
- `apiKey` (required): OpenRouter API key
- `basePrompt`: Base prompt to test
- `variants`: Array of prompt variants
- `models`: Models to test (default: FREE_MODELS)
- `judge`: Judge model (default: 'openai/gpt-4o-mini')
- `autoGenerate`: Auto-generate variants (default: false)
- `numVariants`: Number of variants to generate (default: 10)
- `parallelLimit`: Max parallel tests (default: 5)

**Methods:**
- `testSwarm()`: Run swarm test, returns SwarmResult
- `on(event, callback)`: Listen to events (start, progress, test, complete)

### Constants

```typescript
import { FREE_MODELS, CHEAP_MODELS } from 'evoprompt-core';

// FREE_MODELS: ['meta-llama/llama-3.3-70b-instruct', 'qwen/qwen-2.5-72b-instruct', ...]
// CHEAP_MODELS: Low-cost model options
```

## TypeScript Types

All types are exported:

```typescript
import type {
  PromptGene,
  PromptMetrics,
  EvolutionResult,
  SwarmResult,
  SwarmConfig,
  // ... and more
} from 'evoprompt-core';
```

## Examples

### Custom Variants

```typescript
const variants = [
  { name: 'concise', prompt: 'Explain AI in 2 sentences' },
  { name: 'detailed', prompt: 'Explain AI with examples' },
  { name: 'technical', prompt: 'Explain AI with technical accuracy' },
];

const swarm = new SwarmTester({
  apiKey: process.env.OPENROUTER_API_KEY,
  variants,
  models: ['gpt-4o', 'claude-3.5-sonnet'],
});

const result = await swarm.testSwarm();
```

### Multi-Objective Optimization

Evolution automatically optimizes for:
- **Accuracy** (70%): Judge score
- **Cost** (15%): Token usage
- **Speed** (15%): Latency

Results include Pareto frontier analysis.

## License

MIT

## Links

- [CLI Tool](https://www.npmjs.com/package/evoprompt)
- [GitHub](https://github.com/CVSRohit/EvoPrompt)
- [Documentation](https://github.com/CVSRohit/EvoPrompt#readme)
