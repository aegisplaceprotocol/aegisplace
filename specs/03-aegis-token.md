# Spec: $AEGIS Token Launch + Seed Scripts

## Problem
Need a Token-2022 $AEGIS token on devnet for the hackathon demo, and scripts that seed operators and run a full invocation loop to prove the system works.

## Solution
Three scripts:
1. Token creation with Token-2022 transfer fee extension
2. Operator seeding (5 demo operators registered on-chain)
3. Full-loop demo script (register → invoke → pay → distribute → verify)

## Script 1: Token Launch

### `scripts/create-token.ts`
- Creates $AEGIS mint using Token-2022 program
- Extensions: Transfer Fee (50 bps = 0.5% on every transfer)
- Supply: 1,000,000,000 (1B) tokens, 9 decimals
- Mint authority: admin keypair
- Transfer fee authority: admin keypair (can update fee rate)
- Outputs: mint address, saved to `.env.devnet`

### Token-2022 Config
```
Decimals: 9
Transfer fee: 50 basis points (0.5%)
Max fee: 1,000,000 tokens (cap per transfer)
Withdraw withheld authority: treasury wallet
```

## Script 2: Seed Operators

### `scripts/seed-operators.ts`
Registers 5 demo operators into the on-chain registry:

1. **code-review-v3** - Code review AI, $0.02/call, category: Development
2. **security-audit** - Security scanner, $0.05/call, category: Security
3. **data-extract-pro** - Data extraction, $0.01/call, category: Data
4. **sentiment-v4** - Sentiment analysis, $0.008/call, category: AI/ML
5. **defi-monitor** - DeFi monitoring, $0.03/call, category: DeFi

Each operator:
- Has a real endpoint URL (can point to the gateway's mock responders)
- Gets registered via the Anchor program's `register_operator` instruction
- Outputs: operator PDAs saved for demo script

## Script 3: Full Loop Demo

### `scripts/demo-loop.ts`
Runs the complete Aegis cycle, logging each step to terminal:

```
Step 1: Connect to Solana devnet
Step 2: Load keypairs (admin, creator, caller)
Step 3: Airdrop devnet SOL to all keypairs
Step 4: Create USDC devnet token accounts
Step 5: Register a new operator via Anchor program
Step 6: Verify operator PDA on-chain
Step 7: Invoke skill with USDC payment
Step 8: Verify fee distribution:
  - 60% to creator: ✓ (show balance change)
  - 20% to staker pool: ✓
  - 9% to treasury: ✓
  - 1% to referrer: ✓
Step 9: Check trust score updated
Step 10: Fetch invocation receipt PDA
```

Output: Clean terminal log showing every step with ✓/✗ and Solana Explorer links.

## Acceptance Criteria
- [ ] $AEGIS token created on devnet with Token-2022 + transfer fee extension
- [ ] Token has correct decimals (9), transfer fee (50 bps), supply (1B)
- [ ] 5 operators seeded into on-chain registry
- [ ] Full demo loop completes end-to-end without errors
- [ ] Fee distribution verified: exact amounts to 4 wallets
- [ ] Terminal output is clean and demo-ready (can be screen-recorded)
- [ ] All scripts are idempotent (can re-run without errors)
- [ ] Scripts use devnet only (never touch mainnet)

## Out of Scope
- Bags SDK integration for token listing (separate task)
- LP creation (post-hackathon)
- Token distribution/airdrop mechanism
