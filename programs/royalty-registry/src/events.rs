use anchor_lang::prelude::*;

/// Emitted when a child skill registers a dependency on a parent skill.
#[event]
pub struct DependencyRegistered {
    /// The upstream parent skill's Operator PDA.
    pub parent: Pubkey,

    /// The dependent child skill's Operator PDA.
    pub child: Pubkey,

    /// The wallet that registered this dependency (child creator).
    pub child_creator: Pubkey,

    /// Royalty rate in basis points agreed upon registration.
    pub royalty_bps: u16,

    /// Depth of this edge in the dependency tree (1 = direct parent).
    pub depth: u8,

    /// Unix timestamp of registration.
    pub timestamp: i64,
}

/// Emitted when a child skill removes its dependency on a parent skill.
#[event]
pub struct DependencyRemoved {
    /// The upstream parent skill's Operator PDA.
    pub parent: Pubkey,

    /// The dependent child skill's Operator PDA.
    pub child: Pubkey,

    /// The wallet that removed this dependency (child creator).
    pub child_creator: Pubkey,

    /// Unix timestamp of removal.
    pub timestamp: i64,
}

/// Emitted when the protocol authority deposits royalties into a parent vault.
#[event]
pub struct RoyaltyDeposited {
    /// The child skill whose invocation triggered this deposit.
    pub child_skill: Pubkey,

    /// The parent skill that earned the royalty.
    pub parent_skill: Pubkey,

    /// The parent creator wallet credited with this royalty.
    pub parent_creator: Pubkey,

    /// USDC amount (base units) deposited.
    pub amount: u64,

    /// Protocol-assigned receipt identifier.
    pub receipt_id: u64,

    /// Unix timestamp of the deposit.
    pub timestamp: i64,
}

/// Emitted when a creator successfully withdraws accumulated royalties.
#[event]
pub struct RoyaltyClaimed {
    /// The creator wallet that performed the claim.
    pub creator: Pubkey,

    /// USDC amount (base units) claimed and sent to the creator.
    pub amount: u64,

    /// Remaining unclaimed balance after this claim (always 0 for full claims).
    pub remaining_unclaimed: u64,

    /// Unix timestamp of the claim.
    pub timestamp: i64,
}
