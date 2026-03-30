use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GovernanceConfig {
    pub admin: Pubkey,
    pub governance_token_mint: Pubkey,
    pub voting_period: i64,
    pub quorum_bps: u16,
    pub approval_threshold_bps: u16,
    pub proposal_bond: u64,
    pub execution_delay: i64,
    pub total_proposals: u64,
    pub total_staked: u64,
    pub is_paused: bool,
    pub bump: u8,
}

#[account]
pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    pub title: [u8; 64],
    pub description_hash: [u8; 32],
    pub proposal_type: u8,
    pub status: u8,
    pub votes_for: u64,
    pub votes_against: u64,
    pub votes_abstain: u64,
    pub total_voters: u32,
    pub tokens_deposited: u64,
    pub created_at: i64,
    pub voting_ends_at: i64,
    pub executed_at: i64,
    pub execution_data: [u8; 256],
    pub execution_data_len: u16,
    pub bond_amount: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal_id: u64,
    pub choice: u8,
    pub weight: u64,
    pub voting_power: u64,
    pub timestamp: i64,
    pub bump: u8,
}
