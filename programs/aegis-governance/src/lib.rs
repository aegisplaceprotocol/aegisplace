use anchor_lang::prelude::*;

declare_id!("6TwiJJSscSFpSQA1PU8uYoJHGwgxaprEPJSpKfRireSn");

pub mod state;
pub mod errors;
pub mod events;
pub mod instructions;

use instructions::*;

#[program]
pub mod aegis_governance {
    use super::*;

    /// Initialize the governance system with voting parameters
    pub fn initialize_governance(
        ctx: Context<InitializeGovernance>,
        voting_period: i64,
        quorum_bps: u16,
        approval_threshold_bps: u16,
        proposal_bond: u64,
        execution_delay: i64,
    ) -> Result<()> {
        instructions::initialize_governance::handler(ctx, voting_period, quorum_bps, approval_threshold_bps, proposal_bond, execution_delay)
    }

    /// Create a new governance proposal (requires token bond)
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description_hash: [u8; 32],
        proposal_type: ProposalType,
        execution_data: Vec<u8>,
    ) -> Result<()> {
        instructions::create_proposal::handler(ctx, title, description_hash, proposal_type, execution_data)
    }

    /// Cast a vote on an active proposal (linear token-weighted voting with escrow)
    pub fn cast_vote(
        ctx: Context<CastVote>,
        vote: VoteChoice,
        weight: u64,
    ) -> Result<()> {
        instructions::cast_vote::handler(ctx, vote, weight)
    }

    /// Finalize a proposal after voting period ends
    pub fn finalize_proposal(
        ctx: Context<FinalizeProposal>,
    ) -> Result<()> {
        instructions::finalize_proposal::handler(ctx)
    }

    /// Execute an approved proposal after timelock (returns bond to proposer)
    pub fn execute_proposal(
        ctx: Context<ExecuteProposal>,
    ) -> Result<()> {
        instructions::execute_proposal::handler(ctx)
    }

    /// Cancel a proposal (proposer or admin only, slashes bond)
    pub fn cancel_proposal(
        ctx: Context<CancelProposal>,
    ) -> Result<()> {
        instructions::cancel_proposal::handler(ctx)
    }

    /// Withdraw locked vote tokens after voting period ends
    pub fn withdraw_vote(
        ctx: Context<WithdrawVote>,
    ) -> Result<()> {
        instructions::withdraw_vote::handler(ctx)
    }

    /// Transfer admin rights to a new admin (current admin only)
    pub fn update_governance_admin(
        ctx: Context<UpdateGovernanceAdmin>,
    ) -> Result<()> {
        instructions::update_governance_admin::handler(ctx)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProposalType {
    UpdateFees,
    UpdateConfig,
    AddOperatorCategory,
    TreasurySpend,
    EmergencyPause,
    ProtocolUpgrade,
    CustomInstruction,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VoteChoice {
    For,
    Against,
    Abstain,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Succeeded,
    Defeated,
    Executed,
    Cancelled,
    Expired,
}
