use anchor_lang::prelude::*;
use crate::errors::AegisError;
use crate::events::OperatorDeactivated;
use crate::state::Operator;

/// Deactivates an operator, preventing future invocations.
///
/// Only the operator's creator can deactivate it. This is a soft-delete:
/// the account remains on-chain for historical queries, but is_active is
/// set to false and invoke_skill will reject calls to this operator.
pub fn handler(ctx: Context<DeactivateOperator>) -> Result<()> {
    let operator = &mut ctx.accounts.operator;

    // Prevent redundant deactivation.
    require!(operator.is_active, AegisError::OperatorAlreadyDeactivated);

    operator.is_active = false;

    emit!(OperatorDeactivated {
        operator_id: operator.operator_id,
        operator: operator.key(),
        creator: operator.creator,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct DeactivateOperator<'info> {
    /// The operator's creator. Only they can deactivate their own operator.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The operator to deactivate. `has_one` ensures the signer is the creator.
    #[account(
        mut,
        seeds = [b"operator", operator.creator.as_ref(), operator.operator_id.to_le_bytes().as_ref()],
        bump = operator.bump,
        has_one = creator @ AegisError::Unauthorized,
    )]
    pub operator: Account<'info, Operator>,
}
