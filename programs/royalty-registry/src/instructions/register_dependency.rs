use anchor_lang::prelude::*;
use crate::errors::RoyaltyRegistryError;
use crate::events::DependencyRegistered;
use crate::state::{DependencyEdge, RoyaltyVault};

/// Registers a dependency edge from a child skill to a parent skill.
///
/// The child creator declares that their skill depends on the parent skill
/// and agrees to pay `royalty_bps` basis points of every invocation to
/// the parent creator.
///
/// A RoyaltyVault for the parent creator is created via `init_if_needed`
/// so subsequent deposits can always find it.
///
/// Security:
/// - child_creator must sign
/// - royalty_bps <= 2000 (20% max)
/// - parent != child (no self-referential edges)
/// - depth <= 5 (max tree depth, accepted as input for hackathon)
pub fn handler(
    ctx: Context<RegisterDependency>,
    royalty_bps: u16,
    depth: u8,
) -> Result<()> {
    // Verify parent_operator is owned by the aegis program (i.e., it's a real operator PDA)
    require!(
        ctx.accounts.parent_operator.owner == &crate::aegis_program::ID,
        RoyaltyRegistryError::InvalidDependency
    );

    // Verify child_operator is owned by the aegis program
    require!(
        ctx.accounts.child_operator.owner == &crate::aegis_program::ID,
        RoyaltyRegistryError::InvalidDependency
    );

    // Verify operators are initialized (data length > 8 bytes for discriminator)
    require!(
        ctx.accounts.parent_operator.data_len() > 8,
        RoyaltyRegistryError::InvalidDependency
    );
    require!(
        ctx.accounts.child_operator.data_len() > 8,
        RoyaltyRegistryError::InvalidDependency
    );

    let parent = ctx.accounts.parent_operator.key();
    let child = ctx.accounts.child_operator.key();

    // No self-dependencies allowed.
    require!(parent != child, RoyaltyRegistryError::SelfDependency);

    // Royalty rate must not exceed 20%.
    require!(royalty_bps <= 2_000, RoyaltyRegistryError::RoyaltyBpsTooHigh);

    // Depth must be within bounds (1-indexed, max 5).
    require!(depth >= 1 && depth <= 5, RoyaltyRegistryError::MaxDepthExceeded);

    let now = Clock::get()?.unix_timestamp;

    // Initialize the dependency edge.
    let edge = &mut ctx.accounts.dep_edge;
    edge.parent = parent;
    edge.child = child;
    edge.parent_creator = ctx.accounts.parent_creator.key();
    edge.child_creator = ctx.accounts.child_creator.key();
    edge.royalty_bps = royalty_bps;
    edge.depth = depth;
    edge.registered_at = now;
    edge.bump = ctx.bumps.dep_edge;

    // Initialize the parent vault if it doesn't exist yet.
    // `init_if_needed` handles both cases; we only write fields on first init
    // by checking whether unclaimed == 0 and creator isn't set yet.
    let vault = &mut ctx.accounts.parent_vault;
    if !vault.is_initialized {
        vault.creator = ctx.accounts.parent_creator.key();
        vault.unclaimed = 0;
        vault.total_earned = 0;
        vault.total_claimed = 0;
        vault.last_claim_at = 0;
        vault.is_initialized = true;
        vault.bump = ctx.bumps.parent_vault;
    }

    emit!(DependencyRegistered {
        parent,
        child,
        child_creator: ctx.accounts.child_creator.key(),
        royalty_bps,
        depth,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RegisterDependency<'info> {
    /// The child creator registering the dependency. Signs and pays for accounts.
    #[account(mut)]
    pub child_creator: Signer<'info>,

    /// The parent skill's Operator PDA. Not mutated - only its pubkey is used
    /// as part of the dependency edge seeds.
    /// CHECK: We only read the key; no deserialization needed.
    pub parent_operator: AccountInfo<'info>,

    /// The child skill's Operator PDA. Not mutated - only its pubkey is used
    /// as part of the dependency edge seeds.
    /// CHECK: We only read the key; no deserialization needed.
    pub child_operator: AccountInfo<'info>,

    /// The parent creator wallet. Not a signer - only its pubkey is stored
    /// on the edge and used as a vault seed.
    /// CHECK: We only read the key; stored for vault derivation and auth checks.
    pub parent_creator: AccountInfo<'info>,

    /// The dependency edge PDA. Created on first registration.
    /// Seeds ensure exactly one edge per (parent, child) pair.
    #[account(
        init,
        payer = child_creator,
        space = 8 + DependencyEdge::INIT_SPACE,
        seeds = [
            b"dep_edge",
            parent_operator.key().as_ref(),
            child_operator.key().as_ref(),
        ],
        bump,
    )]
    pub dep_edge: Account<'info, DependencyEdge>,

    /// The parent creator's royalty vault. Created if it doesn't exist yet.
    /// Seeds are deterministic so deposits always find the correct vault.
    #[account(
        init_if_needed,
        payer = child_creator,
        space = 8 + RoyaltyVault::INIT_SPACE,
        seeds = [b"royalty_vault", parent_creator.key().as_ref()],
        bump,
    )]
    pub parent_vault: Account<'info, RoyaltyVault>,

    /// The aegis program for operator ownership validation.
    /// CHECK: Validated by address constraint.
    #[account(address = crate::aegis_program::ID)]
    pub aegis_program: AccountInfo<'info>,

    /// Solana system program for account creation.
    pub system_program: Program<'info, System>,

    /// Rent sysvar for space calculations.
    pub rent: Sysvar<'info, Rent>,
}
