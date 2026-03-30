use anchor_lang::prelude::*;

#[error_code]
pub enum GovernanceError {
    #[msg("Voting period has ended")]
    VotingEnded,
    #[msg("Voting period has not ended yet")]
    VotingNotEnded,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Proposal did not reach quorum")]
    QuorumNotReached,
    #[msg("Proposal was not approved")]
    ProposalNotApproved,
    #[msg("Timelock period has not elapsed")]
    TimelockNotElapsed,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    #[msg("Insufficient bond amount")]
    InsufficientBond,
    #[msg("Title too long (max 64 bytes)")]
    TitleTooLong,
    #[msg("Execution data too long (max 256 bytes)")]
    ExecutionDataTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("Invalid vote weight")]
    InvalidWeight,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Proposal already executed")]
    AlreadyExecuted,
    #[msg("Voting period must be positive and at most 7 days")]
    InvalidVotingPeriod,
    #[msg("Quorum basis points must be between 1 and 10000")]
    InvalidQuorumBps,
    #[msg("Approval threshold basis points must be between 1 and 10000")]
    InvalidApprovalThresholdBps,
    #[msg("Execution delay must be between 0 and 7 days")]
    InvalidExecutionDelay,
    #[msg("Proposal bond must be greater than zero")]
    InvalidProposalBond,
    #[msg("Voting period has not ended yet; cannot withdraw")]
    VotingNotEndedForWithdraw,
    #[msg("Insufficient tokens for vote weight")]
    InsufficientTokens,
}
