use anchor_lang::prelude::*;

/// A directional dependency edge from a child skill to a parent skill.
///
/// Records that the child skill depends on the parent skill and owes
/// royalties to the parent creator. Closed when the dependency is removed.
///
/// PDA seeds: [b"dep_edge", parent.as_ref(), child.as_ref()]
#[account]
#[derive(InitSpace)]
pub struct DependencyEdge {
    /// The upstream skill's Operator PDA (parent in the dependency tree).
    pub parent: Pubkey,

    /// The dependent skill's Operator PDA (child in the dependency tree).
    pub child: Pubkey,

    /// The owner of the parent skill - receives royalties.
    pub parent_creator: Pubkey,

    /// The owner of the child skill - must sign to register or remove.
    pub child_creator: Pubkey,

    /// Royalty rate in basis points. Maximum 2000 (20%).
    pub royalty_bps: u16,

    /// Depth in the dependency tree. 1 = direct parent, max 5.
    pub depth: u8,

    /// Unix timestamp when this dependency was registered.
    pub registered_at: i64,

    /// PDA bump seed.
    pub bump: u8,
}

/// Accumulated royalty balance for a creator wallet.
///
/// Created on first deposit targeting this creator. Tracks unclaimed USDC
/// ready for withdrawal and all-time cumulative totals.
///
/// PDA seeds: [b"royalty_vault", creator.as_ref()]
#[account]
#[derive(InitSpace)]
pub struct RoyaltyVault {
    /// The creator wallet that owns this vault and can claim from it.
    pub creator: Pubkey,

    /// USDC lamports (6-decimal base units) ready to claim right now.
    pub unclaimed: u64,

    /// All-time cumulative USDC deposited into this vault.
    pub total_earned: u64,

    /// All-time cumulative USDC withdrawn from this vault.
    pub total_claimed: u64,

    /// Unix timestamp of the most recent claim. 0 if never claimed.
    pub last_claim_at: i64,

    /// Explicit initialization flag - guards against init_if_needed re-init.
    pub is_initialized: bool,

    /// PDA bump seed.
    pub bump: u8,
}

/// An immutable record of a single royalty deposit event.
///
/// Created by the protocol authority whenever royalties are routed to a
/// parent creator. Provides an auditable trail of every payment.
///
/// PDA seeds: [b"royalty_receipt", child_skill.as_ref(), &receipt_id.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct RoyaltyReceipt {
    /// The child skill whose invocation triggered this royalty payment.
    pub child_skill: Pubkey,

    /// The parent skill that earned the royalty.
    pub parent_skill: Pubkey,

    /// The parent creator wallet that receives the royalty.
    pub parent_creator: Pubkey,

    /// USDC amount (base units) deposited for this receipt.
    pub amount: u64,

    /// The invocation amount from which this royalty was derived.
    pub invocation_amount: u64,

    /// Unix timestamp of the deposit.
    pub timestamp: i64,

    /// PDA bump seed.
    pub bump: u8,
}
