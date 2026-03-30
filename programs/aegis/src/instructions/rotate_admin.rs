use anchor_lang::prelude::*;
use crate::errors::AegisError;
use crate::state::ProtocolConfig;
use crate::events::AdminRotated;

/// Initiates admin rotation by setting a pending admin.
///
/// Only the current admin can initiate the transfer. The new admin must
/// call `accept_admin` to complete the 2-step transfer.
pub fn handler(ctx: Context<RotateAdmin>, new_admin: Pubkey) -> Result<()> {
    require!(new_admin != Pubkey::default(), AegisError::InvalidInput);

    ctx.accounts.config.pending_admin = new_admin;

    emit!(AdminRotated {
        old_admin: ctx.accounts.config.admin,
        new_admin,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RotateAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = admin @ AegisError::Unauthorized,
    )]
    pub config: Account<'info, ProtocolConfig>,

    pub admin: Signer<'info>,
}
