use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("HiDGqc9NX4dbERfqAyq2skF3Tk5vWEjXwsrrtSWxi19v");

/// Aegis Operator Registry - the on-chain backbone of the Aegis AI Agent Marketplace.
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
        slug: String,
        endpoint_url: String,
        metadata_uri: String,
        price_usdc_base: u64,
        category: u8,
    ) -> Result<()> {
        instructions::register_operator::handler(ctx, name, slug, endpoint_url, metadata_uri, price_usdc_base, category)
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

    /// Reactivates a previously deactivated operator.
    ///
    /// Only callable by the operator's creator. The operator must be inactive.
    pub fn reactivate_operator(ctx: Context<ReactivateOperator>) -> Result<()> {
        instructions::reactivate_operator::handler(ctx)
    }

    /// Initiates admin rotation by setting a pending admin.
    ///
    /// Only callable by the current admin. The new admin must call
    /// `accept_admin` to complete the 2-step transfer.
    pub fn rotate_admin(ctx: Context<RotateAdmin>, new_admin: Pubkey) -> Result<()> {
        instructions::rotate_admin::handler(ctx, new_admin)
    }

    /// Accepts a pending admin transfer, completing the 2-step rotation.
    ///
    /// Only callable by the pending admin set via `rotate_admin`.
    pub fn accept_admin(ctx: Context<AcceptAdmin>) -> Result<()> {
        instructions::accept_admin::handler(ctx)
    }

    /// Updates protocol configuration parameters.
    ///
    /// Only callable by the current admin. All parameters are optional;
    /// only provided values are updated.
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_fee_bps: Option<[u16; 6]>,
        new_treasury: Option<Pubkey>,
        new_validator_pool: Option<Pubkey>,
        new_staker_pool: Option<Pubkey>,
        new_insurance_fund: Option<Pubkey>,
    ) -> Result<()> {
        instructions::update_config::handler(ctx, new_fee_bps, new_treasury, new_validator_pool, new_staker_pool, new_insurance_fund)
    }
}
