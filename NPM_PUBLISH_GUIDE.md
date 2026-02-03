# 📦 Publishing EvoPrompt to npm

## Prerequisites

1. **npm account** - Create at https://www.npmjs.com/signup
2. **Email verified** - Check your npm account email

## Publishing Steps

### 1. Login to npm

```bash
npm login
```

Enter your:
- Username
- Password
- Email
- One-time password (if 2FA enabled)

### 2. Build the packages

```bash
npm run build
```

### 3. Publish Core Package

```bash
cd packages/core
npm publish --access public
```

### 4. Publish CLI Package

```bash
cd ../cli
npm publish --access public
```

## Verify Publication

After publishing, verify at:
- https://www.npmjs.com/package/@evoprompt/core
- https://www.npmjs.com/package/evoprompt

## Update README

Once published, update README.md:

```bash
# Remove the "Coming Soon" note
# Change installation to:

### NPM (Global CLI)
```bash
npm install -g evoprompt
```

### NPM (Project Library)
```bash
npm install evoprompt
```

## Version Updates (Future)

When making updates:

1. Update version in package.json files
2. Commit changes: `git commit -am "v1.0.1"`
3. Tag: `git tag v1.0.1`
4. Push: `git push && git push --tags`
5. Rebuild: `npm run build`
6. Publish: `npm publish` (in each package)

## Common Issues

### Package name already exists
- Choose a different name or add scope: `@yourusername/evoprompt`

### Access denied
- Make sure you're logged in: `npm whoami`
- Verify package.json has correct author

### Build errors
- Run `npm install` first
- Check TypeScript errors: `npm run build`
