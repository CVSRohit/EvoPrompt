# 🐝 Feature Proposal: Prompt Swarm

## Overview

Add a `swarm` command to EvoPrompt that tests multiple prompt variations in parallel across free/public models, inspired by [Claude Flow's swarm orchestration](https://github.com/ruvnet/claude-flow).

## Problem Statement

**Current EvoPrompt:**
- Uses genetic algorithms (evolution over generations)
- Costs $0.20-0.40 per optimization
- Takes time (30+ generations)
- Great for finding *optimal* prompts

**Gap:**
- No quick way to A/B test known variations
- No cost-effective bulk testing with free models
- No parallel comparison dashboard

## Solution: Prompt Swarm

Test multiple prompt variations in parallel across free models, get instant comparison.

## CLI Interface

### Basic Swarm Test

```bash
evoprompt swarm "Base prompt" \
  --variants variants.json \
  --models free \
  --judges gpt-4o-mini
```

### With Manual Variants

```bash
evoprompt swarm "Explain quantum computing" \
  --variants "Be concise" "Be detailed" "Use analogies" "Technical explanation" \
  --models llama-3.3-70b qwen-2.5-72b gemma-2-27b \
  --test-cases test-cases.json \
  --output swarm-results.json
```

### Auto-Generate Variants

```bash
evoprompt swarm "Write Python code" \
  --auto-variants 10 \
  --strategies "add_examples,simplify,add_constraints" \
  --models free \
  --parallel 5
```

## Input Format

### variants.json

```json
{
  "base": "Explain quantum computing",
  "variants": [
    {
      "name": "concise",
      "prompt": "Explain quantum computing in 2-3 sentences",
      "strategy": "Be brief"
    },
    {
      "name": "detailed",
      "prompt": "Explain quantum computing in detail with examples and real-world applications",
      "strategy": "Be comprehensive"
    },
    {
      "name": "analogy",
      "prompt": "Explain quantum computing using everyday analogies that anyone can understand",
      "strategy": "Use analogies"
    },
    {
      "name": "technical",
      "prompt": "Explain quantum computing with technical accuracy, including superposition, entanglement, and quantum gates",
      "strategy": "Be technical"
    }
  ]
}
```

### test-cases.json

```json
{
  "cases": [
    {
      "input": "What is quantum computing?",
      "expected_topics": ["superposition", "qubits", "entanglement"]
    },
    {
      "input": "How does it differ from classical computing?",
      "expected_topics": ["bits vs qubits", "parallelism"]
    }
  ]
}
```

## Output Format

### Terminal Output

```
🐝 EvoPrompt Swarm - Parallel Prompt Testing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Testing 4 variants across 3 models (12 total runs)
Models: llama-3.3-70b, qwen-2.5-72b, gemma-2-27b
Judge: gpt-4o-mini
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ Running in parallel (max 5 concurrent)...

✓ concise    → llama-3.3-70b   [2.3s] Score: 7.8/10
✓ detailed   → qwen-2.5-72b    [3.1s] Score: 8.5/10
✓ analogy    → gemma-2-27b     [2.7s] Score: 8.2/10
✓ technical  → llama-3.3-70b   [2.9s] Score: 9.1/10
✓ concise    → qwen-2.5-72b    [2.1s] Score: 7.5/10
...

🏆 Results Summary:

┌──────────────┬───────────┬───────┬────────┬─────────┐
│ Variant      │ Avg Score │ Cost  │ Speed  │ Winner? │
├──────────────┼───────────┼───────┼────────┼─────────┤
│ technical    │ 8.9/10    │ $0.01 │ 2.8s   │    ★    │
│ analogy      │ 8.4/10    │ $0.01 │ 2.6s   │         │
│ detailed     │ 8.2/10    │ $0.02 │ 3.2s   │         │
│ concise      │ 7.6/10    │ $0.01 │ 2.2s   │         │
└──────────────┴───────────┴───────┴────────┴─────────┘

📊 Best Performing Models:
  1. llama-3.3-70b    (avg 8.7/10)
  2. qwen-2.5-72b     (avg 8.3/10)
  3. gemma-2-27b      (avg 7.9/10)

💰 Total Cost: $0.08 (vs $0.30 with paid models)

✅ Winner: "technical" variant
   Prompt: "Explain quantum computing with technical
            accuracy, including superposition,
            entanglement, and quantum gates"
```

### JSON Output (swarm-results.json)

```json
{
  "timestamp": "2026-02-03T04:30:00Z",
  "config": {
    "base_prompt": "Explain quantum computing",
    "num_variants": 4,
    "models": ["llama-3.3-70b", "qwen-2.5-72b", "gemma-2-27b"],
    "judge": "gpt-4o-mini",
    "parallel": 5
  },
  "results": [
    {
      "variant": "technical",
      "prompt": "Explain quantum computing with technical accuracy...",
      "scores_by_model": {
        "llama-3.3-70b": {
          "score": 9.1,
          "cost": 0.003,
          "latency": 2.9,
          "output": "Quantum computing leverages..."
        },
        "qwen-2.5-72b": {
          "score": 8.8,
          "cost": 0.003,
          "latency": 2.7,
          "output": "..."
        },
        "gemma-2-27b": {
          "score": 8.7,
          "cost": 0.002,
          "latency": 2.8,
          "output": "..."
        }
      },
      "avg_score": 8.87,
      "total_cost": 0.008,
      "avg_latency": 2.8
    },
    // ... other variants
  ],
  "winner": {
    "variant": "technical",
    "score": 8.87,
    "reason": "Highest average score across all models"
  },
  "insights": {
    "best_model": "llama-3.3-70b",
    "cost_savings_vs_paid": "73%",
    "fastest_variant": "concise",
    "most_consistent": "analogy"
  }
}
```

## Architecture

### Core Components

```typescript
// packages/core/src/swarm-tester.ts

export class SwarmTester {
  private client: OpenRouterClient;
  private parallelLimit: number;

  async testSwarm(config: SwarmConfig): Promise<SwarmResult> {
    // 1. Generate or load variants
    const variants = config.autoGenerate
      ? await this.generateVariants(config.basePrompt, config.numVariants)
      : config.variants;

    // 2. Create test matrix (variants × models)
    const testMatrix = this.createTestMatrix(variants, config.models);

    // 3. Run tests in parallel (with concurrency limit)
    const results = await this.runParallel(testMatrix, config.parallelLimit);

    // 4. Evaluate with judge
    const evaluated = await this.evaluateResults(results, config.judge);

    // 5. Analyze and rank
    return this.analyzeResults(evaluated);
  }

  private async runParallel(
    tests: TestCase[],
    limit: number
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const queue = [...tests];
    const active: Promise<TestResult>[] = [];

    while (queue.length > 0 || active.length > 0) {
      // Fill up to parallel limit
      while (active.length < limit && queue.length > 0) {
        const test = queue.shift()!;
        active.push(this.runSingleTest(test));
      }

      // Wait for one to complete
      const result = await Promise.race(active);
      results.push(result);

      // Remove completed from active
      const idx = active.indexOf(result as any);
      active.splice(idx, 1);
    }

    return results;
  }
}
```

### CLI Command

```typescript
// packages/cli/src/commands/swarm.ts

export async function swarmCommand(prompt: string, options: SwarmOptions) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OPENROUTER_API_KEY required');
    process.exit(1);
  }

  console.log('🐝 EvoPrompt Swarm - Parallel Prompt Testing\n');

  const swarmTester = new SwarmTester({
    apiKey,
    judge: options.judges[0],
    models: options.models === 'free' ? FREE_MODELS : options.models,
    parallelLimit: options.parallel || 5,
    verbose: options.verbose
  });

  // Load or generate variants
  const variants = options.variants
    ? await loadVariants(options.variants)
    : await autoGenerateVariants(prompt, options.autoVariants);

  // Run swarm test
  const spinner = ora('Running swarm test...').start();

  swarmTester.on('test', (event) => {
    spinner.text = `Testing ${event.variant} on ${event.model}...`;
  });

  const result = await swarmTester.testSwarm({
    basePrompt: prompt,
    variants,
    models: options.models,
    judge: options.judges[0],
    parallelLimit: options.parallel
  });

  spinner.succeed('Swarm test complete!\n');

  // Display results
  renderSwarmResults(result);

  // Save if requested
  if (options.output) {
    await saveResults(result, options.output);
    console.log(`\n✅ Results saved to ${options.output}`);
  }
}
```

## Free Model Presets

```typescript
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen-2.5-72b-instruct',
  'google/gemma-2-27b-it',
  'mistralai/mistral-7b-instruct',
  'microsoft/phi-3-medium-4k-instruct'
];

const CHEAP_MODELS = [
  'openai/gpt-4o-mini',
  'anthropic/claude-3-haiku',
  'google/gemini-flash-1.5'
];
```

## Use Cases

### 1. Quick A/B Testing

You have 3 prompt variations and want to know which is best:

```bash
evoprompt swarm "Write Python code" \
  --variants "Be concise" "Add docstrings" "Include tests" \
  --models free
```

**Cost:** ~$0.05 (vs $0.30 with genetic algorithm)
**Time:** ~10 seconds (vs 5 minutes)

### 2. Cost-Effective Exploration

Test 20 variations cheaply before investing in full evolution:

```bash
evoprompt swarm "Explain machine learning" \
  --auto-variants 20 \
  --models free \
  --output swarm-results.json

# Then evolve the top 3
evoprompt optimize "$(jq -r '.winner.prompt' swarm-results.json)" \
  --generations 30
```

### 3. Model Selection

Find which free model works best for your use case:

```bash
evoprompt swarm "Translate to Spanish" \
  --variants variants.json \
  --models llama-3.3-70b qwen-2.5-72b gemma-2-27b mistral-7b \
  --compare-models
```

### 4. Prompt Library Testing

Test your entire prompt library:

```bash
evoprompt swarm-batch prompts/*.json \
  --models free \
  --parallel 10 \
  --output batch-results/
```

## Integration with Genetic Evolution

**Workflow: Swarm → Evolve → Deploy**

```bash
# 1. Quick swarm test (20 variants, free models)
evoprompt swarm "Base prompt" \
  --auto-variants 20 \
  --models free \
  --output swarm.json

# 2. Extract top 3 variants
TOP3=$(jq -r '.results | sort_by(.avg_score) | reverse | .[0:3] | .[].prompt' swarm.json)

# 3. Evolve each top variant
for prompt in $TOP3; do
  evoprompt optimize "$prompt" \
    --generations 30 \
    --output "evolved-$i.json"
done

# 4. Final comparison
evoprompt compare \
  "$(jq -r '.finalPrompt.text' evolved-1.json)" \
  "$(jq -r '.finalPrompt.text' evolved-2.json)" \
  "$(jq -r '.finalPrompt.text' evolved-3.json)" \
  --models gpt-4o claude-opus-4.5
```

## Advantages

| Benefit | Description |
|---------|-------------|
| **💰 Cost-effective** | Use free models: $0.05 vs $0.30 |
| **⚡ Fast** | Parallel execution: 10s vs 5min |
| **🎯 Focused** | Test known variations, not random mutations |
| **📊 Visual** | Clear comparison dashboard |
| **🔄 Complementary** | Works with genetic evolution |
| **🌍 Accessible** | No API costs for experimentation |

## Implementation Priority

### Phase 1: MVP (1 week)
- [ ] SwarmTester core class
- [ ] Basic parallel execution
- [ ] swarm CLI command
- [ ] Free model presets
- [ ] Simple results display

### Phase 2: Enhanced (1 week)
- [ ] Auto-variant generation
- [ ] Test cases support
- [ ] Detailed comparison dashboard
- [ ] Integration with optimize command

### Phase 3: Advanced (1 week)
- [ ] Batch testing
- [ ] Visual web dashboard
- [ ] Model recommendation engine
- [ ] Prompt library management

## Marketing Angle

**"EvoPrompt: Evolution + Swarm"**

- **Swarm** for quick A/B testing with free models
- **Evolution** for finding optimal prompts
- **Best of both worlds**

Tweet:
> "Why choose between speed and quality?
>
> EvoPrompt now has BOTH:
> 🐝 Swarm mode: Test 20 variants in 10 seconds (free models)
> 🧬 Evolution mode: Optimize to perfection (genetic algorithm)
>
> Start with swarm, evolve the winners. 🚀"

## Comparison to Competitors

| Feature | EvoPrompt | promptfoo | Braintrust | Claude Flow |
|---------|-----------|-----------|------------|-------------|
| Genetic evolution | ✅ | ❌ | ❌ | ❌ |
| Parallel swarm | ✅ (NEW) | ✅ | ✅ | ✅ |
| Free models | ✅ | ✅ | ⚠️ | ❌ |
| Cost optimization | ✅ | ❌ | ❌ | ❌ |
| OpenRouter | ✅ | ⚠️ | ❌ | ✅ |
| CLI + Library | ✅ | ✅ | ✅ | ✅ |
| **Unique combo** | ✅ Both! | - | - | - |

## References

- [Claude Flow - Agent Swarm Orchestration](https://github.com/ruvnet/claude-flow)
- [Claude Code Hidden Swarms Feature](https://news.ycombinator.com/item?id=46743908)
- [promptfoo - Open Source LLM Testing](https://github.com/promptfoo/promptfoo)
- [Braintrust A/B Testing Guide](https://www.braintrust.dev/articles/ab-testing-llm-prompts)
- [Langfuse Prompt A/B Testing](https://langfuse.com/docs/prompt-management/features/a-b-testing)

---

**This feature would make EvoPrompt the ONLY tool offering both genetic evolution AND parallel swarm testing. 🚀**
