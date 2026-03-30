use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::GovernanceError;
use crate::events::ProposalExecuted;
use crate::ProposalStatus;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        seeds = [b"governance"],
        bump = config.bump,
    )]
    pub config: Account<'info, GovernanceConfig>,

    #[account(
        mut,
        seeds = [b"proposal", proposal.id.to_le_bytes().as_ref()],
        bump = proposal.bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub executor: Signer<'info>,

    /// The proposer who gets their bond back on successful execution.
    /// CHECK: Validated against proposal.proposer.
    #[account(
        mut,
        constraint = proposer.key() == proposal.proposer @ GovernanceError::Unauthorized,
    )]
    pub proposer: AccountInfo<'info>,

    /// Proposer's governance token account (destination for returned bond).
    #[account(
        mut,
        constraint = proposer_token_account.owner == proposal.proposer @ GovernanceError::Unauthorized,
        constraint = proposer_token_account.mint == config.governance_token_mint @ GovernanceError::Unauthorized,
    )]
    pub proposer_token_account: Account<'info, TokenAccount>,

    /// Bond escrow token account holding the proposer's bond.
    #[account(
        mut,
        seeds = [b"bond_escrow", proposal.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub bond_escrow: Account<'info, TokenAccount>,

    /// The PDA authority for bond escrow accounts.
    /// CHECK: PDA used as token authority only.
    #[account(
        seeds = [b"bond_escrow_auth"],
        bump,
    )]
    pub bond_escrow_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let config = &ctx.accounts.config;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    require!(proposal.status == ProposalStatus::Succeeded as u8, GovernanceError::ProposalNotApproved);
    require!(proposal.executed_at == 0, GovernanceError::AlreadyExecuted);

    // Enforce timelock
    let earliest_execution = proposal.voting_ends_at
        .checked_add(config.execution_delay)
        .ok_or(GovernanceError::ArithmeticOverflow)?;
    require!(clock.unix_timestamp >= earliest_execution, GovernanceError::TimelockNotElapsed);

    proposal.status = ProposalStatus::Executed as u8;
    proposal.executed_at = clock.unix_timestamp;

    // FIX 2: Return bond to proposer on successful execution
    let bond_amount = ctx.accounts.bond_escrow.amount;
    if bond_amount > 0 {
        let auth_bump = ctx.bumps.bond_escrow_authority;
        let signer_seeds: &[&[u8]] = &[b"bond_escrow_auth", &[auth_bump]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bond_escrow.to_account_info(),
                    to: ctx.accounts.proposer_token_account.to_account_info(),
                    authority: ctx.accounts.bond_escrow_authority.to_account_info(),
                },
                &[signer_seeds],
            ),
            bond_amount,
        )?;

        // Close the bond escrow account and return rent to proposer
        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.bond_escrow.to_account_info(),
                    destination: ctx.accounts.proposer.to_account_info(),
                    authority: ctx.accounts.bond_escrow_authority.to_account_info(),
                },
                &[signer_seeds],
            ),
        )?;
    }

    // NOTE: Actual CPI execution of the proposal's instruction data would happen here.
    // For safety, the execution_data is stored on-chain but the actual CPI
    // is handled by a separate executor service that deserializes and validates
    // the instruction before forwarding. This prevents arbitrary code execution
    // within the governance program itself.

    emit!(ProposalExecuted {
        proposal_id: proposal.id,
        executor: ctx.accounts.executor.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
