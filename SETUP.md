# 🔧 Development Setup

Complete setup guide for building and developing EvoPrompt.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **TypeScript** 5.3+
- **Git**

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/evoprompt.git
cd evoprompt
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all packages in the monorepo.

### 3. Build All Packages

```bash
npm run build
```

This compiles TypeScript to JavaScript for:
- `packages/core` - Core genetic algorithm engine
- `packages/cli` - Command-line interface

### 4. Set Up Environment

Create `.env` file:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_SITE_URL=https://github.com/yourusername/evoprompt
OPENROUTER_APP_NAME=evoprompt
```

## Project Structure

```
evoprompt/
├── packages/
│   ├── core/                 # Core genetic algorithm library
│   │   ├── src/
│   │   │   ├── types.ts              # TypeScript interfaces
│   │   │   ├── genetic-algorithm.ts  # GA implementation
│   │   │   ├── openrouter-client.ts  # API client
│   │   │   ├── prompt-evolver.ts     # Main evolver class
│   │   │   └── index.ts              # Exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── cli/                  # Command-line interface
│       ├── src/
│       │   ├── commands/
│       │   │   ├── optimize.ts   # Optimize command
│       │   │   └── compare.ts    # Compare command
│       │   ├── utils/
│       │   │   ├── display.ts    # Display utilities
│       │   │   └── file.ts       # File utilities
│       │   └── index.ts          # CLI entry point
│       ├── package.json
│       └── tsconfig.json
│
├── examples/                 # Example scripts
│   ├── basic-usage.ts
│   └── advanced-usage.ts
│
├── package.json              # Root package.json
├── tsconfig.json             # Root TypeScript config
├── .env.example              # Environment template
├── README.md                 # Main documentation
├── QUICKSTART.md             # Quick start guide
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # MIT license
```

## Development Workflow

### Build in Watch Mode

```bash
# Terminal 1 - Watch core package
cd packages/core
npm run dev

# Terminal 2 - Watch CLI package
cd packages/cli
npm run dev
```

### Run CLI Locally

```bash
# From root directory
npm run cli optimize "test prompt"

# Or directly
node packages/cli/dist/index.js optimize "test prompt"
```

### Run Examples

```bash
# Build first
npm run build

# Run basic example
npx tsx examples/basic-usage.ts

# Run advanced example
npx tsx examples/advanced-usage.ts
```

## Testing

### Manual Testing

```bash
# Test optimize command
npm run cli optimize "Explain AI" -- --generations 5 --verbose

# Test compare command
npm run cli compare "What is life?" -- --models gpt-4o claude-3.5-sonnet

# Test models command
npm run cli models
```

### Integration Testing

Create a test script `test-integration.sh`:

```bash
#!/bin/bash

echo "Testing EvoPrompt CLI..."

# Test 1: Optimize with defaults
echo "Test 1: Basic optimization"
npx evoprompt optimize "test" --generations 3 --population 3

# Test 2: Multi-model comparison
echo "Test 2: Model comparison"
npx evoprompt compare "test" --models gpt-4o claude-3.5-sonnet

# Test 3: Save output
echo "Test 3: Save results"
npx evoprompt optimize "test" --generations 3 --output test-results.json

echo "All tests passed!"
```

## Debugging

### Enable Verbose Logging

```bash
npm run cli optimize "test" -- --verbose
```

### Debug in VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/packages/cli/dist/index.js",
      "args": ["optimize", "test prompt", "--generations", "5", "--verbose"],
      "outFiles": ["${workspaceFolder}/**/*.js"],
      "env": {
        "OPENROUTER_API_KEY": "your_key_here"
      }
    }
  ]
}
```

### Common Issues

#### TypeScript Compilation Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

#### Module Resolution Errors

Make sure `package.json` has `"type": "module"` and imports use `.js` extension:

```typescript
import { PromptEvolver } from './prompt-evolver.js';  // ✅
import { PromptEvolver } from './prompt-evolver';     // ❌
```

#### OpenRouter API Errors

Check:
1. API key is valid: `echo $OPENROUTER_API_KEY`
2. Key has credits: Visit [OpenRouter Dashboard](https://openrouter.ai/activity)
3. Model IDs are correct: Run `npm run cli models`

## Publishing

### Prepare for Release

1. Update version in `package.json` files
2. Update `CHANGELOG.md`
3. Build all packages: `npm run build`
4. Test thoroughly

### Publish to NPM

```bash
# Login to npm
npm login

# Publish core package
cd packages/core
npm publish --access public

# Publish CLI package
cd ../cli
npm publish --access public
```

### Create GitHub Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then create release on GitHub with:
- Release notes
- Built binaries (if applicable)
- Changelog

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test
```

## Performance Optimization

### Reduce Build Time

Use `--incremental` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "incremental": true
  }
}
```

### Reduce Bundle Size

Use tree-shaking and don't import entire libraries:

```typescript
// ✅ Good
import { someFunction } from 'library/someFunction';

// ❌ Bad
import * as library from 'library';
```

## Documentation

### Generate API Docs

```bash
npm install -g typedoc
typedoc packages/core/src/index.ts --out docs
```

### Update README

Keep these sections up-to-date:
- Installation instructions
- API reference
- Examples
- Changelog

## Need Help?

- 📖 [README](README.md)
- 🚀 [Quick Start](QUICKSTART.md)
- 💬 [Discussions](https://github.com/yourusername/evoprompt/discussions)
- 🐛 [Issues](https://github.com/yourusername/evoprompt/issues)

---

**Happy coding! 🧬**
