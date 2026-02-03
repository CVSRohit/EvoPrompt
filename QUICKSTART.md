# 🚀 Quick Start Guide

Get started with EvoPrompt in 5 minutes.

## Step 1: Install

```bash
npm install -g evoprompt
```

## Step 2: Get API Key

1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign up (free)
3. Create an API key
4. Copy your key

## Step 3: Set API Key

**Option A: Environment Variable**

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

**Option B: .env File**

Create `.env` in your project:

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

## Step 4: Run Your First Evolution

```bash
evoprompt optimize "Explain quantum computing"
```

That's it! Watch your prompt evolve in real-time.

## What's Happening?

1. **Generation 0** - Starts with your basic prompt
2. **Mutations** - Creates variations ("add examples", "be more specific")
3. **Evaluation** - Runs each variant through GPT-4 and judges quality
4. **Selection** - Keeps best prompts, discards worst
5. **Repeat** - Does this 30 times
6. **Result** - Gives you optimized prompt (often 25%+ better)

## Example Output

```
Gen 00 | Best: 0.623 | Avg: 0.589 | Diversity: 142
Gen 05 | Best: 0.742 | Avg: 0.698 | Diversity: 187
Gen 10 | Best: 0.814 | Avg: 0.776 | Diversity: 203
Gen 15 | Best: 0.847 | Avg: 0.821 | Diversity: 189
...
Gen 30 | Best: 0.892 | Avg: 0.869 | Diversity: 156

✅ Evolution complete!

Optimized Prompt:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Explain quantum computing clearly and accessibly.
Start with the concept of superposition, contrasting
it with classical bits. Describe entanglement and
its implications. Include a real-world analogy, and
conclude with applications in cryptography and
optimization.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Improvements:
  Accuracy: +43.2%
  Cost:     +12.1%
  Speed:    +18.7%
```

## Next Steps

### Try Different Models

```bash
evoprompt optimize "Your prompt" \
  --models gpt-4o claude-3.5-sonnet llama-3.3-70b \
  --judges gpt-4o
```

### Use Multiple Judges (Better Accuracy)

```bash
evoprompt optimize "Your prompt" \
  --judges gpt-4o claude-opus-4.5 llama-3.3-70b
```

### Save Results

```bash
evoprompt optimize "Your prompt" --output results.json
```

### Compare Models

```bash
evoprompt compare "What is AI?" \
  --models gpt-4o claude-3.5-sonnet llama-3.3-70b
```

## Use as Library

```typescript
import { PromptEvolver } from 'evoprompt';

const evolver = new PromptEvolver({
  apiKey: process.env.OPENROUTER_API_KEY!,
  judges: ['gpt-4o'],
  targetModels: ['gpt-4o', 'claude-3.5-sonnet']
});

const result = await evolver.evolve('Your prompt', 30);
console.log(result.finalPrompt.text);
```

## Tips

### 1. Start Simple

Don't over-optimize. Start with 10-20 generations.

### 2. Use Good Judges

Better judges = better results. GPT-4o and Claude Opus 4.5 are best.

### 3. Multiple Judges Reduce Bias

Use 3-5 judges for critical prompts (costs 3-5x but 30-40% less bias).

### 4. Balance Weights

Default weights favor accuracy (70%). Adjust based on your needs:

```typescript
fitnessWeights: {
  accuracy: 0.5,  // Lower if cost matters more
  cost: 0.3,      // Higher for budget-conscious
  speed: 0.2      // Higher for latency-sensitive
}
```

### 5. Watch for Convergence

If diversity stays low for 5+ generations, evolution may be stuck. Try:
- Higher mutation rate (0.4-0.5)
- Larger population (15-20)
- Different mutation strategies

## Common Issues

### "API Key Not Found"

Make sure `OPENROUTER_API_KEY` is set:

```bash
echo $OPENROUTER_API_KEY  # Should show your key
```

### "Rate Limit Exceeded"

You're hitting API limits. Try:
- Smaller population size (`--population 6`)
- Fewer generations (`--generations 20`)
- Wait and retry

### "Low Improvement"

Initial prompt might already be good! Try:
- Start with a simpler prompt
- More generations (`--generations 50`)
- Better judge models

## Cost Estimates

Typical costs for 30 generations with population of 10:

- **With GPT-4o**: ~$0.20-0.40 per evolution
- **With Claude Opus**: ~$0.40-0.80 per evolution
- **With GPT-4o-mini**: ~$0.02-0.05 per evolution

## Need Help?

- 📖 [Full Documentation](README.md)
- 💬 [GitHub Discussions](https://github.com/yourusername/evoprompt/discussions)
- 🐛 [Report Issues](https://github.com/yourusername/evoprompt/issues)
- 📧 Email: your.email@example.com

---

**Happy evolving! 🧬**
