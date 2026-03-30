use anchor_lang::prelude::*;
use crate::state::{ProtocolConfig, Operator};
use crate::errors::AegisError;

/// Reactivates a previously deactivated operator.
///
/// Only the operator's creator can reactivate it. The operator must
/// currently be inactive.
pub fn handler(ctx: Context<ReactivateOperator>) -> Result<()> {
    ctx.accounts.operator.is_active = true;
    Ok(())
}

#[derive(Accounts)]
pub struct ReactivateOperator<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [b"operator", operator.creator.as_ref(), operator.operator_id.to_le_bytes().as_ref()],
        bump = operator.bump,
        constraint = !operator.is_active @ AegisError::OperatorAlreadyActive,
    )]
    pub operator: Account<'info, Operator>,

    #[account(
        constraint = creator.key() == operator.creator @ AegisError::Unauthorized,
    )]
    pub creator: Signer<'info>,
}
