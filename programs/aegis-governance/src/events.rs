use anchor_lang::prelude::*;

#[event]
pub struct ProposalCreated {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub proposal_type: u8,
    pub voting_ends_at: i64,
    pub bond_amount: u64,
}

#[event]
pub struct VoteCast {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub choice: u8,
    pub weight: u64,
    pub voting_power: u64,
}

#[event]
pub struct ProposalFinalized {
    pub proposal_id: u64,
    pub status: u8,
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_voters: u32,
}

#[event]
pub struct ProposalExecuted {
    pub proposal_id: u64,
    pub executor: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProposalCancelled {
    pub proposal_id: u64,
    pub cancelled_by: Pubkey,
}

#[event]
pub struct VoteWithdrawn {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub weight: u64,
}

#[event]
pub struct AdminTransferred {
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
}
