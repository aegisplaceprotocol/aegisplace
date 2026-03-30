use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, CloseAccount, Mint, Token, TokenAccount};
use crate::state::*;
use crate::errors::GovernanceError;
use crate::events::ProposalCancelled;
use crate::ProposalStatus;

#[derive(Accounts)]
pub struct CancelProposal<'info> {
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

    #[account(mut)]
    pub authority: Signer<'info>,

    /// Bond escrow token account holding the proposer's bond (slashed on cancel).
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

    /// The governance token mint (for burning slashed bond).
    #[account(
        mut,
        constraint = governance_token_mint.key() == config.governance_token_mint @ GovernanceError::Unauthorized,
    )]
    pub governance_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let config = &ctx.accounts.config;

    require!(proposal.status == ProposalStatus::Active as u8, GovernanceError::ProposalNotActive);

    // Only proposer or admin can cancel
    let is_proposer = ctx.accounts.authority.key() == proposal.proposer;
    let is_admin = ctx.accounts.authority.key() == config.admin;
    require!(is_proposer || is_admin, GovernanceError::Unauthorized);

    proposal.status = ProposalStatus::Cancelled as u8;

    // FIX 2: Slash bond - burn the escrowed tokens
    let bond_amount = ctx.accounts.bond_escrow.amount;
    if bond_amount > 0 {
        let auth_bump = ctx.bumps.bond_escrow_authority;
        let signer_seeds: &[&[u8]] = &[b"bond_escrow_auth", &[auth_bump]];

        token::burn(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.governance_token_mint.to_account_info(),
                    from: ctx.accounts.bond_escrow.to_account_info(),
                    authority: ctx.accounts.bond_escrow_authority.to_account_info(),
                },
                &[signer_seeds],
            ),
            bond_amount,
        )?;

        // Close the bond escrow account and return rent to authority
        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.bond_escrow.to_account_info(),
                    destination: ctx.accounts.authority.to_account_info(),
                    authority: ctx.accounts.bond_escrow_authority.to_account_info(),
                },
                &[signer_seeds],
            ),
        )?;
    }

    emit!(ProposalCancelled {
        proposal_id: proposal.id,
        cancelled_by: ctx.accounts.authority.key(),
    });

    Ok(())
}
