use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR");

/// Aegis Operator Registry — the on-chain backbone of the Aegis AI Agent Marketplace.
///
/// This program manages:
/// - Protocol-wide configuration and fee schedules
/// - Operator (AI agent skill) registration and lifecycle
/// - Skill invocation with immediate USDC fee distribution to 6 parties
/// - On-chain trust scoring updated by protocol validators
///
/// All state transitions emit events for off-chain indexing.
#[program]
pub mod aegis {
    use super::*;

    /// Initializes the global protocol configuration.
    ///
    /// Must be called exactly once. Sets the admin, treasury addresses,
    /// AEGIS mint, USDC mint, and the 6-way fee schedule (must sum to 10000).
    /// Default: [6000, 1500, 1200, 800, 300, 200] = 60/15/12/8/3/2
    pub fn initialize(ctx: Context<Initialize>, fee_bps: [u16; 6]) -> Result<()> {
        instructions::initialize::handler(ctx, fee_bps)
    }

    /// Registers a new operator (AI agent skill) on the protocol.
    ///
    /// Creates a unique PDA for the operator. The operator starts with
    /// a trust score of 5000 (50%) and is immediately active.
    pub fn register_operator(
        ctx: Context<RegisterOperator>,
        name: String,
        endpoint_url: String,
        price_lamports: u64,
        category: u8,
    ) -> Result<()> {
        instructions::register_operator::handler(ctx, name, endpoint_url, price_lamports, category)
    }

    /// Invokes an operator's skill, paying in USDC.
    ///
    /// The payment is immediately split among 6 parties:
    ///   - 60% to the skill creator
    ///   - 15% to the validator pool
    ///   - 12% to veAEGIS stakers
    ///   - 8%  to the dynamic treasury
    ///   - 3%  to the insurance fund
    ///   - 2%  burned (permanently removed)
    ///
    /// An immutable InvocationReceipt is created on-chain.
    pub fn invoke_skill(ctx: Context<InvokeSkill>) -> Result<()> {
        instructions::invoke_skill::handler(ctx)
    }

    /// Updates an operator's trust score by a signed delta.
    ///
    /// Only callable by the protocol admin. The score is clamped to [0, 10000].
    pub fn update_trust(ctx: Context<UpdateTrust>, delta: i16) -> Result<()> {
        instructions::update_trust::handler(ctx, delta)
    }

    /// Deactivates an operator, preventing future invocations.
    ///
    /// Only callable by the operator's creator. This is a soft-delete;
    /// the on-chain account is preserved for historical queries.
    pub fn deactivate_operator(ctx: Context<DeactivateOperator>) -> Result<()> {
        instructions::deactivate_operator::handler(ctx)
    }
}
