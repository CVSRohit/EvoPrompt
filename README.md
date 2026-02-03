# 🧬 EvoPrompt

<div align="center">

**Evolve your prompts to perfection using genetic algorithms and LLM judges**

[![npm version](https://img.shields.io/npm/v/evoprompt.svg)](https://www.npmjs.com/package/evoprompt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Examples](#-examples) • [API](#-api) • [How It Works](#-how-it-works)

</div>

---

## 🎯 What is EvoPrompt?

**Stop manually tweaking prompts. Let evolution do it for you.**

EvoPrompt automatically evolves your prompts across 500+ models using **genetic algorithms** and **LLM judges**, achieving up to **25% better results** based on research from [EvoPrompt (ICLR 2024)](https://arxiv.org/abs/2309.08532).

### The Problem

Prompt engineering is:
- ⏰ **Time-consuming** - Hours of manual tweaking
- 🎲 **Unpredictable** - No systematic improvement
- 💸 **Expensive** - Testing across models costs money
- 🤷 **Subjective** - Hard to measure quality

### The Solution

EvoPrompt uses **evolutionary algorithms** inspired by natural selection:

```
Initial Prompt (Generation 0)
    ↓
Mutation + Crossover → Population of variants
    ↓
LLM Judges evaluate quality
    ↓
Best prompts selected for reproduction
    ↓
Repeat for N generations
    ↓
Optimized Prompt (up to 25% better)
```

---

## ✨ Features

- 🧬 **Genetic Algorithm** - Mutation, crossover, selection, elitism
- ⚖️ **LLM-as-a-Judge** - Use GPT-4, Claude, or any model to evaluate outputs
- 🎭 **Multi-Judge Jury** - Combine multiple judges for better evaluation (reduces bias by 30-40%)
- 📊 **Multi-Objective Optimization** - Optimize for accuracy, cost, AND speed simultaneously
- 🚀 **500+ Models** - Via OpenRouter integration
- 📈 **3D Pareto Frontier** - Visualize cost vs speed vs accuracy trade-offs
- 💻 **CLI + Library** - Use as command-line tool or import in your code
- 🎨 **Beautiful Output** - ASCII charts, progress bars, colored tables
- 💾 **Export Results** - Save evolution history as JSON

---

## 📦 Installation

> **Note:** npm package publishing in progress. For now, install from source.

### From Source (Recommended)

```bash
git clone https://github.com/CVSRohit/EvoPrompt.git
cd EvoPrompt
npm install
npm run build

# Link globally to use 'evoprompt' command
cd packages/cli
npm link
```

### NPM (Coming Soon)

```bash
# Will be available soon:
npm install -g evoprompt
```

---

## 🚀 Quick Start

### 1. Get an API Key

Get your free API key from [OpenRouter](https://openrouter.ai/keys) (supports 500+ models)

### 2. Set Environment Variable

```bash
export OPENROUTER_API_KEY="your_key_here"
```

Or create a `.env` file:

```env
OPENROUTER_API_KEY=your_key_here
```

### 3. Run Evolution

```bash
evoprompt optimize "Explain quantum computing"
```

That's it! Watch your prompt evolve in real-time.

---

## 📖 Examples

### CLI Usage

#### Basic Optimization

```bash
evoprompt optimize "Write a sorting algorithm"
```

#### Advanced Options

```bash
evoprompt optimize "Explain machine learning" \
  --models gpt-4o claude-3.5-sonnet llama-3.3-70b \
  --judges gpt-4o claude-opus-4.5 \
  --generations 50 \
  --population 12 \
  --output results.json \
  --verbose
```

#### Compare Models

```bash
evoprompt compare "What is the meaning of life?" \
  --models gpt-4o claude-3.5-sonnet llama-3.3-70b
```

#### List Available Models

```bash
evoprompt models
```

### Library Usage

#### Basic Example

```typescript
import { PromptEvolver } from 'evoprompt';

const evolver = new PromptEvolver({
  apiKey: process.env.OPENROUTER_API_KEY!,
  judges: ['gpt-4o'],
  targetModels: ['gpt-4o', 'claude-3.5-sonnet'],
  populationSize: 10,
  verbose: true
});

const result = await evolver.evolve('Explain quantum computing', 30);

console.log('Optimized:', result.finalPrompt.text);
console.log('Improvement:', result.improvement.accuracy, '%');
```

#### Advanced Multi-Judge Example

```typescript
import { PromptEvolver } from 'evoprompt';

// Use a jury of 3 judges (reduces bias by 30-40%)
const evolver = new PromptEvolver({
  apiKey: process.env.OPENROUTER_API_KEY!,
  judges: ['gpt-4o', 'claude-opus-4.5', 'llama-3.3-70b'],
  targetModels: ['gpt-4o', 'claude-3.5-sonnet', 'llama-3.3-70b', 'qwen-2.5-72b'],
  populationSize: 12,
  mutationRate: 0.4,
  crossoverRate: 0.6,
  elitismRate: 0.2,
  fitnessWeights: {
    accuracy: 0.6,  // Prioritize accuracy
    cost: 0.25,     // Consider cost
    speed: 0.15     // Less emphasis on speed
  }
});

// Listen to events
evolver.on('generation', (stats) => {
  console.log(`Gen ${stats.generation}: Fitness=${stats.bestFitness}`);
});

evolver.on('mutation', ({ parent, mutated }) => {
  console.log('Mutation:', mutated.text);
});

const result = await evolver.evolve('Write a Python function', 50);
```

#### Save and Resume

```typescript
import { writeFileSync, readFileSync } from 'fs';

// Save results
const result = await evolver.evolve(prompt, 50);
writeFileSync('evolution.json', JSON.stringify(result, null, 2));

// Load and analyze
const saved = JSON.parse(readFileSync('evolution.json', 'utf-8'));
console.log('Best prompt:', saved.finalPrompt.text);
console.log('History:', saved.history);
```

---

## 🔧 API Reference

### `PromptEvolver`

Main class for prompt evolution.

#### Constructor

```typescript
new PromptEvolver(config: EvolverConfig)
```

**Config Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | **required** | OpenRouter API key |
| `judges` | string[] | **required** | Judge model IDs |
| `targetModels` | string[] | **required** | Models to optimize for |
| `populationSize` | number | `10` | Population size per generation |
| `mutationRate` | number | `0.3` | Probability of mutation (0-1) |
| `crossoverRate` | number | `0.7` | Probability of crossover (0-1) |
| `elitismRate` | number | `0.1` | Fraction of top performers to preserve |
| `fitnessWeights` | object | `{accuracy: 0.7, cost: 0.15, speed: 0.15}` | Multi-objective weights |
| `verbose` | boolean | `false` | Enable detailed logging |

#### Methods

##### `evolve(initialPrompt: string, generations: number): Promise<EvolutionResult>`

Run the genetic algorithm.

**Returns:**

```typescript
interface EvolutionResult {
  finalPrompt: PromptGene;     // Best prompt found
  history: GenerationStats[];  // Evolution history
  improvement: {               // Percentage improvements
    accuracy: number;
    cost: number;
    speed: number;
  };
  totalGenerations: number;
  totalEvaluations: number;
  totalCost: number;           // Total cost in USD
}
```

##### `on(event: string, callback: Function): void`

Listen to events:

- `generation` - Fired after each generation
- `evaluation` - Fired after evaluating a prompt
- `mutation` - Fired after mutation
- `error` - Fired on errors

---

## 🧠 How It Works

### 1. Initialization

Start with a population of prompts (all identical to your initial prompt).

### 2. Evaluation

Each prompt is:
1. Run across all target models
2. Outputs are evaluated by judge models (0-10 score)
3. Metrics collected: accuracy, cost, speed, latency

### 3. Fitness Calculation

Multi-objective fitness function:

```
fitness = w1 × accuracy + w2 × (1 - cost) + w3 × speed
```

Default weights: `accuracy=0.7, cost=0.15, speed=0.15`

### 4. Selection

**Tournament selection** - Best individuals from random subsets are selected for reproduction.

### 5. Reproduction

**Elitism** - Top 10% of population preserved.

**Crossover** (70% of offspring):
```
Parent 1: "Explain quantum computing in detail"
Parent 2: "Describe quantum computing with examples"
     ↓
Child: "Explain quantum computing in detail with examples"
```

**Mutation** (30% of offspring):
```
Original: "Write a sorting algorithm"
Strategy: "Add more specific details"
     ↓
Mutated: "Write an efficient sorting algorithm in Python
          with time complexity analysis"
```

### 6. Repeat

Repeat steps 2-5 for N generations or until convergence.

---

## 🎓 Research Background

EvoPrompt is based on groundbreaking research:

- **[EvoPrompt Paper (ICLR 2024)](https://arxiv.org/abs/2309.08532)** - Shows 25% improvement on benchmarks
- **[LLM-as-a-Judge](https://labelyourdata.com/articles/llm-as-a-judge)** - 80% agreement with humans, 500x cheaper
- **[LLM Juries](https://www.comet.com/site/blog/llm-juries-for-evaluation/)** - Multiple judges outperform single judge by 7x lower cost

### Key Findings

- ✅ **25% improvement** on BIG-Bench Hard tasks
- ✅ **80-85% agreement** with human evaluators
- ✅ **30-40% bias reduction** with LLM juries
- ✅ **500-5000x cost savings** vs human evaluation

---

## 🎯 Use Cases

### 1. **Optimize Production Prompts**
Fine-tune prompts for your production LLM applications.

### 2. **A/B Testing**
Automatically generate better prompt variants for testing.

### 3. **Cost Optimization**
Find cheaper models that maintain quality for your use case.

### 4. **Prompt Engineering Research**
Systematically explore the prompt space.

### 5. **Multi-Model Routing**
Identify which models excel at which tasks.

---

## 📊 Example Output

```
🧬 EvoPrompt - Genetic Prompt Evolution

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initial prompt: Explain quantum computing
Target models: gpt-4o, claude-3.5-sonnet
Judge models: gpt-4o
Generations: 30
Population: 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✔ Evolution complete! 🎉

🎉 Optimized Prompt:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Explain quantum computing in clear, accessible terms. Start
with the fundamental concept of superposition and how it
differs from classical bits. Then describe entanglement and
its implications. Provide a real-world analogy and conclude
with practical applications in cryptography and optimization.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Metrics:

┌──────────┬─────────┬─────────┬─────────┐
│ Metric   │ Initial │ Final   │ Change  │
├──────────┼─────────┼─────────┼─────────┤
│ Accuracy │ 6.2/10  │ 8.7/10  │ +40.3%  │
│ Cost     │ $0.0045 │ $0.0038 │ +15.6%  │
│ Speed    │ 42 tk/s │ 53 tk/s │ +26.2%  │
└──────────┴─────────┴─────────┴─────────┘

📈 Summary:

  Generations:  30
  Evaluations:  147
  Total Cost:   $0.2847
  Final Fitness: 0.8423

📉 Evolution Progress:

  0.843 │
        ┤████████████████████████████████████████
        │
        │
        │
        │      ████
        │    ██
        │  ██
        │ █
        │█
  0.512 └────────────────────────────────────────
         0                            Generation
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. 🐛 **Report bugs** - Open an issue
2. 💡 **Suggest features** - Start a discussion
3. 🔧 **Submit PRs** - Fix bugs or add features
4. 📖 **Improve docs** - Help others understand
5. ⭐ **Star the repo** - Show your support!

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [EvoPrompt Paper (ICLR 2024)](https://arxiv.org/abs/2309.08532) by Guo et al.
- [OpenRouter](https://openrouter.ai/) for unified LLM API access
- Genetic algorithm research and evolutionary computation community

---

## 📮 Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/CVSRohit/EvoPrompt/issues)
- **Twitter**: [@yourusername](https://twitter.com/yourusername)
- **Email**: your.email@example.com

---

<div align="center">

**Made with 🧬 by the EvoPrompt community**

[⬆ back to top](#-evoprompt)

</div>
