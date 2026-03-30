use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::GovernanceError;
use crate::events::ProposalCreated;
use crate::{ProposalType, ProposalStatus};

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [b"governance"],
        bump = config.bump,
    )]
    pub config: Account<'info, GovernanceConfig>,

    #[account(
        init,
        payer = proposer,
        space = 8 + 32 + 64 + 32 + 1 + 1 + 8*3 + 4 + 8 + 8*2 + 8 + 256 + 2 + 8 + 1 + 64,
        seeds = [b"proposal", config.total_proposals.to_le_bytes().as_ref()],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    /// Proposer's governance token account (source of bond).
    #[account(
        mut,
        constraint = proposer_token_account.owner == proposer.key() @ GovernanceError::Unauthorized,
        constraint = proposer_token_account.mint == config.governance_token_mint @ GovernanceError::Unauthorized,
    )]
    pub proposer_token_account: Account<'info, TokenAccount>,

    /// Bond escrow token account (PDA-owned, holds bond tokens).
    #[account(
        init_if_needed,
        payer = proposer,
        token::mint = governance_token_mint,
        token::authority = bond_escrow_authority,
        seeds = [b"bond_escrow", config.total_proposals.to_le_bytes().as_ref()],
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

    /// The governance token mint.
    #[account(
        constraint = governance_token_mint.key() == config.governance_token_mint @ GovernanceError::Unauthorized,
    )]
    pub governance_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateProposal>,
    title: String,
    description_hash: [u8; 32],
    proposal_type: ProposalType,
    execution_data: Vec<u8>,
) -> Result<()> {
    require!(!ctx.accounts.config.is_paused, GovernanceError::ProtocolPaused);
    require!(title.len() <= 64, GovernanceError::TitleTooLong);
    require!(execution_data.len() <= 256, GovernanceError::ExecutionDataTooLong);

    let config = &mut ctx.accounts.config;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    // FIX 2: Transfer bond tokens from proposer into bond escrow
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.proposer_token_account.to_account_info(),
                to: ctx.accounts.bond_escrow.to_account_info(),
                authority: ctx.accounts.proposer.to_account_info(),
            },
        ),
        config.proposal_bond,
    )?;

    // Copy title into fixed-size array
    let mut title_bytes = [0u8; 64];
    let title_slice = title.as_bytes();
    title_bytes[..title_slice.len()].copy_from_slice(title_slice);

    // Copy execution data into fixed-size array
    let mut exec_bytes = [0u8; 256];
    exec_bytes[..execution_data.len()].copy_from_slice(&execution_data);

    proposal.id = config.total_proposals;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.title = title_bytes;
    proposal.description_hash = description_hash;
    proposal.proposal_type = proposal_type as u8;
    proposal.status = ProposalStatus::Active as u8;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.votes_abstain = 0;
    proposal.total_voters = 0;
    proposal.tokens_deposited = 0;
    proposal.created_at = clock.unix_timestamp;
    proposal.voting_ends_at = clock.unix_timestamp
        .checked_add(config.voting_period)
        .ok_or(GovernanceError::ArithmeticOverflow)?;
    proposal.executed_at = 0;
    proposal.execution_data = exec_bytes;
    proposal.execution_data_len = execution_data.len() as u16;
    proposal.bond_amount = config.proposal_bond;
    proposal.bump = ctx.bumps.proposal;

    config.total_proposals = config.total_proposals
        .checked_add(1)
        .ok_or(GovernanceError::ArithmeticOverflow)?;

    emit!(ProposalCreated {
        proposal_id: proposal.id,
        proposer: proposal.proposer,
        proposal_type: proposal.proposal_type,
        voting_ends_at: proposal.voting_ends_at,
        bond_amount: proposal.bond_amount,
    });

    Ok(())
}
