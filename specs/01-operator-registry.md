# Spec: Operator Registry Program (Anchor/Rust)

## Problem
AI agent skills have no on-chain registry. No discovery, no payment verification, no trust scoring, no fee distribution. Everything is off-chain and unverifiable.

## Solution
An Anchor program on Solana that registers operator skills, handles invocation payments, distributes fees to 4 parties, and tracks trust scores - all on-chain and verifiable.

## Data Model

### ProtocolConfig PDA
- Seeds: `["config"]`
- Fields:
  - `admin: Pubkey` - upgrade authority
  - `treasury: Pubkey` - protocol treasury wallet
  - `staker_pool: Pubkey` - $AEGIS staker reward pool
  - `aegis_mint: Pubkey` - $AEGIS Token-2022 mint
  - `total_operators: u64`
  - `total_invocations: u64`
  - `total_volume_lamports: u64`
  - `fee_bps: [u16; 4]` - [creator=7000, stakers=2000, treasury=900, referrer=100]
  - `bump: u8`

### Operator PDA
- Seeds: `["operator", creator.key(), operator_id.to_le_bytes()]`
- Fields:
  - `creator: Pubkey`
  - `operator_id: u64`
  - `name: String` (max 64)
  - `endpoint_url: String` (max 256)
  - `price_lamports: u64` - price per invocation in USDC lamports (6 decimals)
  - `category: u8` - enum index
  - `trust_score: u16` - 0-10000 (basis points, so 9500 = 95.00)
  - `total_invocations: u64`
  - `successful_invocations: u64`
  - `total_earned_lamports: u64`
  - `is_active: bool`
  - `created_at: i64`
  - `bump: u8`

### Invocation PDA
- Seeds: `["invocation", operator.key(), invocation_id.to_le_bytes()]`
- Fields:
  - `operator: Pubkey`
  - `caller: Pubkey`
  - `amount_paid: u64`
  - `response_ms: u32`
  - `success: bool`
  - `trust_delta: i16`
  - `timestamp: i64`
  - `bump: u8`

## Instructions

### `initialize(fee_bps: [u16; 4])`
- Signer: admin
- Creates: ProtocolConfig PDA
- Validates: fee_bps sums to 10000

### `register_operator(name, endpoint_url, price_lamports, category)`
- Signer: creator
- Creates: Operator PDA
- Increments: config.total_operators
- Emits: `OperatorRegistered { operator_id, creator, name }`

### `invoke_skill(operator_id)`
- Signer: caller (payer)
- Transfers: USDC from caller to escrow/split accounts
- Records: Invocation PDA
- Distributes fees immediately:
  - 70% → creator token account
  - 20% → staker_pool token account
  - 9% → treasury token account
  - 1% → referrer token account (or treasury if no referrer)
- Increments: operator.total_invocations, config.total_invocations
- Emits: `SkillInvoked { operator_id, caller, amount, timestamp }`

### `update_trust(operator_id, delta)`
- Signer: admin or authorized validator
- Updates: operator.trust_score (clamped 0-10000)
- Emits: `TrustUpdated { operator_id, old_score, new_score }`

### `deactivate_operator(operator_id)`
- Signer: creator (owner)
- Sets: operator.is_active = false
- Emits: `OperatorDeactivated { operator_id }`

## Acceptance Criteria
- [ ] ProtocolConfig PDA created with correct fee basis points summing to 10000
- [ ] Operators registered with unique PDA per creator+id combo
- [ ] invoke_skill transfers USDC and splits to exactly 4 accounts
- [ ] Fee math: 60/15/12/8/3/2 in basis points, no floating point
- [ ] Trust score clamped 0-10000, only admin/validator can update
- [ ] All state changes emit events
- [ ] 10+ TypeScript tests covering happy path and error cases
- [ ] Deploys to devnet with `anchor deploy`

## Out of Scope
- Staking mechanism (post-hackathon)
- Dispute resolution (post-hackathon)
- Token-2022 transfer hook (post-hackathon)
- Validator consensus (off-chain for now)
