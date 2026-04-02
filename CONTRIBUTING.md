# Contributing to Aegis Protocol

Thank you for your interest in contributing to Aegis Protocol. This guide will help you get started.

## Development Environment Setup

### Prerequisites

- **Node.js** 22+
- **pnpm** 9+
- **Rust** (latest stable) with `cargo`
- **Solana CLI** 2.2.12+
- **Anchor** 0.30.1+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/aegisplace/aegis-protocol.git
cd aegis-protocol

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start the development server
pnpm dev
```

### Building

```bash
# Build the client
pnpm build

# Build Solana programs
anchor build

# Type check
npx tsc --noEmit
```

## Branch Naming Conventions

Use the following prefixes for branch names:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code refactoring (no behavior change) |
| `docs/` | Documentation updates |
| `test/` | Adding or updating tests |
| `chore/` | Build, CI, dependency updates |

Examples:
- `feat/royalty-dashboard`
- `fix/trust-score-calculation`
- `refactor/operator-service`

## Pull Request Process

1. **Fork the repository** and create your branch from `main`.
2. **Keep PRs focused.** One feature or fix per PR.
3. **Write a clear description** explaining what changed and why.
4. **Ensure CI passes.** All checks must be green before merging.
5. **Request review** from at least one maintainer.
6. **Squash and merge** is the preferred merge strategy.

### PR Checklist

- [ ] Code compiles without errors (`npx tsc --noEmit`)
- [ ] Client builds successfully (`pnpm build`)
- [ ] Anchor programs build (`anchor build`)
- [ ] No new lint warnings
- [ ] Tests pass for affected areas
- [ ] Documentation updated if needed

## Code Style

### General Rules

- Use TypeScript for all client and server code.
- Use Rust for Solana programs.
- Follow existing patterns and conventions in the codebase.

### Prohibited Patterns

The CI pipeline enforces the following rules. PRs that violate them will fail checks.

**No `console.log` or `console.debug` in client code.**
Use a structured logger instead. Console statements in `client/src/` will trigger a CI warning.

```typescript
// Bad
console.log("user connected", wallet);

// Good
logger.info("user connected", { wallet });
```

**No `data-loc` attributes in JSX.**
These are debug trace attributes and must be removed before committing.

```tsx
// Bad
<div data-loc="abc123">

// Good
<div>
```

**No hardcoded secrets.**
Never commit private keys, API keys, or tokens. Use environment variables.

```typescript
// Bad
const key = "sk-abc123...";

// Good
const key = process.env.API_KEY;
```

### Formatting

- Use 2-space indentation for TypeScript/TSX.
- Use 4-space indentation for Rust.
- Keep lines under 100 characters where practical.

## Testing

### Client

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch
```

### Solana Programs

```bash
# Run Anchor tests
anchor test
```

### E2E Tests

```bash
# Run end-to-end tests
pnpm test:e2e
```

### Testing Requirements

- New features should include tests.
- Bug fixes should include a regression test when feasible.
- Anchor program changes require integration tests.

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests.
- For security vulnerabilities, see [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
