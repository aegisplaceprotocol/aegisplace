use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::GovernanceError;
use crate::events::VoteCast;
use crate::{VoteChoice, ProposalStatus};

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
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

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal.id.to_le_bytes().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    /// Voter's governance token account (source of vote weight tokens).
    #[account(
        mut,
        constraint = voter_token_account.owner == voter.key() @ GovernanceError::Unauthorized,
        constraint = voter_token_account.mint == config.governance_token_mint @ GovernanceError::Unauthorized,
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    /// Vote escrow token account (PDA-owned, holds locked vote tokens).
    #[account(
        init,
        payer = voter,
        token::mint = governance_token_mint,
        token::authority = vote_escrow_authority,
        seeds = [b"vote_escrow", proposal.id.to_le_bytes().as_ref(), voter.key().as_ref()],
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

    /// The governance token mint.
    #[account(
        constraint = governance_token_mint.key() == config.governance_token_mint @ GovernanceError::Unauthorized,
    )]
    pub governance_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CastVote>,
    vote: VoteChoice,
    weight: u64,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let config = &mut ctx.accounts.config;
    let clock = Clock::get()?;

    require!(proposal.status == ProposalStatus::Active as u8, GovernanceError::ProposalNotActive);
    require!(clock.unix_timestamp < proposal.voting_ends_at, GovernanceError::VotingEnded);
    require!(weight > 0, GovernanceError::InvalidWeight);

    // FIX 1: Transfer vote weight tokens from voter into escrow
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.voter_token_account.to_account_info(),
                to: ctx.accounts.vote_escrow.to_account_info(),
                authority: ctx.accounts.voter.to_account_info(),
            },
        ),
        weight,
    )?;

    // FIX 4: Linear voting - 1 token = 1 vote (no quadratic/sqrt)
    let voting_power = weight;

    match vote {
        VoteChoice::For => {
            proposal.votes_for = proposal.votes_for
                .checked_add(voting_power)
                .ok_or(GovernanceError::ArithmeticOverflow)?;
        }
        VoteChoice::Against => {
            proposal.votes_against = proposal.votes_against
                .checked_add(voting_power)
                .ok_or(GovernanceError::ArithmeticOverflow)?;
        }
        VoteChoice::Abstain => {
            proposal.votes_abstain = proposal.votes_abstain
                .checked_add(voting_power)
                .ok_or(GovernanceError::ArithmeticOverflow)?;
        }
    }

    proposal.total_voters = proposal.total_voters
        .checked_add(1)
        .ok_or(GovernanceError::ArithmeticOverflow)?;
    proposal.tokens_deposited = proposal.tokens_deposited
        .checked_add(weight)
        .ok_or(GovernanceError::ArithmeticOverflow)?;

    // FIX 3: Update total_staked to track cumulative tokens locked in active votes
    config.total_staked = config.total_staked
        .checked_add(weight)
        .ok_or(GovernanceError::ArithmeticOverflow)?;

    let record = &mut ctx.accounts.vote_record;
    record.voter = ctx.accounts.voter.key();
    record.proposal_id = proposal.id;
    record.choice = vote as u8;
    record.weight = weight;
    record.voting_power = voting_power;
    record.timestamp = clock.unix_timestamp;
    record.bump = ctx.bumps.vote_record;

    emit!(VoteCast {
        proposal_id: proposal.id,
        voter: record.voter,
        choice: record.choice,
        weight,
        voting_power,
    });

    Ok(())
}
