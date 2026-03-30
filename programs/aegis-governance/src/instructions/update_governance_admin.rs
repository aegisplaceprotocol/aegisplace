use anchor_lang::prelude::*;
use crate::state::GovernanceConfig;
use crate::errors::GovernanceError;
use crate::events::AdminTransferred;

#[derive(Accounts)]
pub struct UpdateGovernanceAdmin<'info> {
    #[account(
        mut,
        seeds = [b"governance"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ GovernanceError::Unauthorized,
    )]
    pub config: Account<'info, GovernanceConfig>,

    pub admin: Signer<'info>,

    /// CHECK: The new admin can be any valid pubkey.
    pub new_admin: AccountInfo<'info>,
}

pub fn handler(ctx: Context<UpdateGovernanceAdmin>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let old_admin = config.admin;
    config.admin = ctx.accounts.new_admin.key();

    emit!(AdminTransferred {
        old_admin,
        new_admin: config.admin,
    });

    Ok(())
}
