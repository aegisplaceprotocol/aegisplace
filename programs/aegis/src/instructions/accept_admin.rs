use anchor_lang::prelude::*;
use crate::state::ProtocolConfig;
use crate::errors::AegisError;

/// Completes the 2-step admin transfer.
///
/// The pending admin (set by `rotate_admin`) must sign this transaction
/// to accept the admin role and finalize the transfer.
pub fn handler(ctx: Context<AcceptAdmin>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = config.pending_admin;
    config.pending_admin = Pubkey::default();
    Ok(())
}

#[derive(Accounts)]
pub struct AcceptAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.pending_admin == new_admin.key() @ AegisError::Unauthorized,
        constraint = config.pending_admin != Pubkey::default() @ AegisError::PendingAdminNotSet,
    )]
    pub config: Account<'info, ProtocolConfig>,

    pub new_admin: Signer<'info>,
}
