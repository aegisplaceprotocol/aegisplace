use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::GovernanceConfig;
use crate::errors::GovernanceError;

#[derive(Accounts)]
pub struct InitializeGovernance<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GovernanceConfig::INIT_SPACE,
        seeds = [b"governance"],
        bump,
    )]
    pub config: Account<'info, GovernanceConfig>,

    /// The governance token mint used for voting and bonds.
    pub governance_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeGovernance>,
    voting_period: i64,
    quorum_bps: u16,
    approval_threshold_bps: u16,
    proposal_bond: u64,
    execution_delay: i64,
) -> Result<()> {
    // FIX 5: Validate governance parameters
    require!(voting_period > 0 && voting_period <= 604800, GovernanceError::InvalidVotingPeriod);
    require!(quorum_bps > 0 && quorum_bps <= 10000, GovernanceError::InvalidQuorumBps);
    require!(approval_threshold_bps > 0 && approval_threshold_bps <= 10000, GovernanceError::InvalidApprovalThresholdBps);
    require!(execution_delay >= 0 && execution_delay <= 604800, GovernanceError::InvalidExecutionDelay);
    require!(proposal_bond > 0, GovernanceError::InvalidProposalBond);

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.governance_token_mint = ctx.accounts.governance_token_mint.key();
    config.voting_period = voting_period;
    config.quorum_bps = quorum_bps;
    config.approval_threshold_bps = approval_threshold_bps;
    config.proposal_bond = proposal_bond;
    config.execution_delay = execution_delay;
    config.total_proposals = 0;
    config.total_staked = 0;
    config.is_paused = false;
    config.bump = ctx.bumps.config;
    Ok(())
}
