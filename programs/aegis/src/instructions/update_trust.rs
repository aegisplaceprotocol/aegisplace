use anchor_lang::prelude::*;
use crate::errors::AegisError;
use crate::events::TrustUpdated;
use crate::state::{Operator, ProtocolConfig};

/// Updates an operator's trust score by a signed delta.
///
/// Only the protocol admin (or a future authorized validator) can call this.
/// The trust score is clamped to [0, 10000] after applying the delta.
pub fn handler(ctx: Context<UpdateTrust>, delta: i16) -> Result<()> {
    // Cap the delta to +/- 500 per update to prevent trust score manipulation.
    require!(delta >= -500 && delta <= 500, AegisError::TrustDeltaTooLarge);

    let operator = &mut ctx.accounts.operator;
    let old_score = operator.trust_score;

    // Apply the delta with clamping to [0, 10000].
    let new_score_raw = (old_score as i32).saturating_add(delta as i32);
    let new_score = new_score_raw.clamp(0, 10_000) as u16;

    operator.trust_score = new_score;

    emit!(TrustUpdated {
        operator_id: operator.operator_id,
        operator: operator.key(),
        old_score,
        new_score,
        delta,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateTrust<'info> {
    /// The protocol admin. Only the admin can update trust scores.
    pub admin: Signer<'info>,

    /// The protocol configuration. Used to validate admin authority.
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = admin @ AegisError::Unauthorized,
    )]
    pub config: Account<'info, ProtocolConfig>,

    /// The operator whose trust score is being updated.
    #[account(
        mut,
        seeds = [b"operator", operator.creator.as_ref(), operator.operator_id.to_le_bytes().as_ref()],
        bump = operator.bump,
    )]
    pub operator: Account<'info, Operator>,
}
