use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::GovernanceError;
use crate::events::ProposalFinalized;
use crate::ProposalStatus;

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
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

    pub finalizer: Signer<'info>,
}

pub fn handler(ctx: Context<FinalizeProposal>) -> Result<()> {
    let config = &ctx.accounts.config;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    require!(proposal.status == ProposalStatus::Active as u8, GovernanceError::ProposalNotActive);
    require!(clock.unix_timestamp >= proposal.voting_ends_at, GovernanceError::VotingNotEnded);

    // Check quorum: total voting power must exceed quorum_bps of total_staked
    let total_votes = proposal.votes_for
        .checked_add(proposal.votes_against)
        .ok_or(GovernanceError::ArithmeticOverflow)?
        .checked_add(proposal.votes_abstain)
        .ok_or(GovernanceError::ArithmeticOverflow)?;

    let quorum_required = if config.total_staked > 0 {
        (config.total_staked as u128)
            .checked_mul(config.quorum_bps as u128)
            .ok_or(GovernanceError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(GovernanceError::ArithmeticOverflow)? as u64
    } else {
        0 // If nothing staked, any vote passes quorum
    };

    if total_votes < quorum_required {
        proposal.status = ProposalStatus::Defeated as u8;
    } else {
        // Check approval threshold
        let total_decisive = proposal.votes_for
            .checked_add(proposal.votes_against)
            .ok_or(GovernanceError::ArithmeticOverflow)?;

        if total_decisive == 0 {
            proposal.status = ProposalStatus::Defeated as u8;
        } else {
            let approval_pct = (proposal.votes_for as u128)
                .checked_mul(10000)
                .ok_or(GovernanceError::ArithmeticOverflow)?
                .checked_div(total_decisive as u128)
                .ok_or(GovernanceError::ArithmeticOverflow)? as u16;

            if approval_pct >= config.approval_threshold_bps {
                proposal.status = ProposalStatus::Succeeded as u8;
            } else {
                proposal.status = ProposalStatus::Defeated as u8;
            }
        }
    }

    emit!(ProposalFinalized {
        proposal_id: proposal.id,
        status: proposal.status,
        votes_for: proposal.votes_for,
        votes_against: proposal.votes_against,
        total_voters: proposal.total_voters,
    });

    Ok(())
}
