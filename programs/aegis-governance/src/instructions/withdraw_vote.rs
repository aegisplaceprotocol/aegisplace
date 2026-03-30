use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::GovernanceError;
use crate::events::VoteWithdrawn;

#[derive(Accounts)]
pub struct WithdrawVote<'info> {
    #[account(
        mut,
        seeds = [b"governance"],
        bump = config.bump,
    )]
    pub config: Account<'info, GovernanceConfig>,

    #[account(
        seeds = [b"proposal", proposal.id.to_le_bytes().as_ref()],
        bump = proposal.bump,
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        seeds = [b"vote", vote_record.proposal_id.to_le_bytes().as_ref(), voter.key().as_ref()],
        bump = vote_record.bump,
        constraint = vote_record.voter == voter.key() @ GovernanceError::Unauthorized,
        close = voter,
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    /// Voter's governance token account (destination for returned tokens).
    #[account(
        mut,
        constraint = voter_token_account.owner == voter.key() @ GovernanceError::Unauthorized,
        constraint = voter_token_account.mint == config.governance_token_mint @ GovernanceError::Unauthorized,
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    /// Vote escrow token account holding locked vote tokens.
    #[account(
        mut,
        seeds = [b"vote_escrow", vote_record.proposal_id.to_le_bytes().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_escrow: Account<'info, TokenAccount>,

    /// The PDA authority for vote escrow accounts.
    /// CHECK: PDA used as token authority only.
    #[account(
        seeds = [b"vote_escrow_auth"],
        bump,
    )]
    pub vote_escrow_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawVote>) -> Result<()> {
    let clock = Clock::get()?;
    let proposal = &ctx.accounts.proposal;

    // Can only withdraw after voting period ends
    require!(
        clock.unix_timestamp >= proposal.voting_ends_at,
        GovernanceError::VotingNotEndedForWithdraw
    );

    let weight = ctx.accounts.vote_record.weight;
    let auth_bump = ctx.bumps.vote_escrow_authority;
    let signer_seeds: &[&[u8]] = &[b"vote_escrow_auth", &[auth_bump]];

    // Transfer locked tokens back to voter
    let escrow_amount = ctx.accounts.vote_escrow.amount;
    if escrow_amount > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vote_escrow.to_account_info(),
                    to: ctx.accounts.voter_token_account.to_account_info(),
                    authority: ctx.accounts.vote_escrow_authority.to_account_info(),
                },
                &[signer_seeds],
            ),
            escrow_amount,
        )?;
    }

    // Close the vote escrow token account and return rent to voter
    token::close_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vote_escrow.to_account_info(),
                destination: ctx.accounts.voter.to_account_info(),
                authority: ctx.accounts.vote_escrow_authority.to_account_info(),
            },
            &[signer_seeds],
        ),
    )?;

    // Update total_staked tracking
    let config = &mut ctx.accounts.config;
    config.total_staked = config.total_staked.saturating_sub(weight);

    emit!(VoteWithdrawn {
        proposal_id: ctx.accounts.proposal.id,
        voter: ctx.accounts.voter.key(),
        weight,
    });

    Ok(())
}
