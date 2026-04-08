use anchor_lang::prelude::*;

/// Global protocol configuration - singleton PDA seeded by ["config"].
/// Stores admin authority, treasury addresses, fee schedule, and aggregate counters.
#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    /// The admin pubkey with authority to update config and trust scores.
    pub admin: Pubkey,

    /// Protocol treasury wallet that receives the treasury fee share.
    pub treasury: Pubkey,

    /// Validator pool that receives the validator fee share.
    pub validator_pool: Pubkey,

    /// Staker reward pool that receives the staker fee share.
    pub staker_pool: Pubkey,

    /// Insurance fund that receives the insurance fee share.
    pub insurance_fund: Pubkey,

    /// The $AEGIS Token-2022 mint address.
    pub aegis_mint: Pubkey,

    /// The known USDC mint address (validated during invocations).
    pub usdc_mint: Pubkey,

    /// Total number of operators registered across the protocol.
    pub total_operators: u64,

    /// Total number of skill invocations across all operators.
    pub total_invocations: u64,

    /// Total USDC volume (in base units, 6 decimals) processed.
    pub total_volume_lamports: u64,

    /// Fee distribution in basis points:
    /// [creator, validators, stakers, treasury, insurance, burned].
    /// Must sum to 10000 (100.00%).
    /// Default: [8500, 1000, 0, 300, 150, 50]
    pub fee_bps: [u16; 6],

    /// Pending admin for 2-step admin transfer. Default (zero) means no pending transfer.
    pub pending_admin: Pubkey,

    /// PDA bump seed for deterministic address derivation.
    pub bump: u8,
}

/// An operator (AI agent skill provider) registered on the protocol.
/// PDA seeded by ["operator", creator, operator_id].
#[account]
#[derive(InitSpace)]
pub struct Operator {
    /// The wallet that created and owns this operator.
    pub creator: Pubkey,

    /// Unique operator ID (sequential per creator, derived from config.total_operators).
    pub operator_id: u64,

    /// Human-readable name for the operator/skill.
    #[max_len(64)]
    pub name: String,

    /// URL-safe marketplace slug. Stable lookup key shared by frontend, MCP, and REST.
    #[max_len(64)]
    pub slug: String,

    /// Canonical metadata document for rich marketplace fields that do not need to live on-chain.
    #[max_len(200)]
    pub metadata_uri: String,

    /// Price per invocation in USDC base units (6 decimals).
    pub price_usdc_base: u64,

    /// Category enum index (0-255). Used for marketplace filtering.
    pub category: u8,

    /// Trust score in basis points (0 = untrusted, 10000 = fully trusted).
    /// Starts at 5000 (50%) for new operators.
    pub trust_score: u16,

    /// Total number of times this operator's skill has been invoked.
    pub total_invocations: u64,

    /// Number of successful invocations (used for trust calculation).
    pub successful_invocations: u64,

    /// Total USDC earned by this operator (creator share only).
    pub total_earned_lamports: u64,

    /// Whether this operator is currently accepting invocations.
    pub is_active: bool,

    /// Unix timestamp of when this operator was registered.
    pub created_at: i64,

    /// PDA bump seed.
    pub bump: u8,
}

/// A receipt for a single skill invocation. Immutable after creation.
/// PDA seeded by ["invocation", operator, invocation_id].
#[account]
#[derive(InitSpace)]
pub struct InvocationReceipt {
    /// The operator PDA that was invoked.
    pub operator: Pubkey,

    /// The wallet that paid for and initiated the invocation.
    pub caller: Pubkey,

    /// Total USDC amount paid (before fee split).
    pub amount_paid: u64,

    /// Off-chain response latency in milliseconds (set by oracle/validator).
    pub response_ms: u32,

    /// Whether the invocation was successful.
    pub success: bool,

    /// Trust score change resulting from this invocation.
    pub trust_delta: i16,

    /// Unix timestamp of the invocation.
    pub timestamp: i64,

    /// PDA bump seed.
    pub bump: u8,
}
