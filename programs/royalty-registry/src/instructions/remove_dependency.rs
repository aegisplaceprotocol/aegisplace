use anchor_lang::prelude::*;
use crate::errors::RoyaltyRegistryError;
use crate::events::DependencyRemoved;
use crate::state::DependencyEdge;

/// Removes a dependency edge between a child skill and its parent skill.
///
/// Only the child creator who originally registered the dependency can remove it.
/// The DependencyEdge PDA is closed and the lamports are returned to the
/// child creator.
///
/// Note: Removing a dependency does NOT affect already-deposited royalties in
/// the parent vault. Those remain claimable by the parent creator.
pub fn handler(ctx: Context<RemoveDependency>) -> Result<()> {
    let edge = &ctx.accounts.dep_edge;

    // Only the child creator who registered the edge can remove it.
    require!(
        edge.child_creator == ctx.accounts.child_creator.key(),
        RoyaltyRegistryError::Unauthorized
    );

    let now = Clock::get()?.unix_timestamp;
    let parent = edge.parent;
    let child = edge.child;
    let child_creator = ctx.accounts.child_creator.key();

    // The `close = child_creator` constraint on dep_edge handles closing the
    // account and returning lamports. We just emit the event here.
    emit!(DependencyRemoved {
        parent,
        child,
        child_creator,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveDependency<'info> {
    /// The child creator requesting removal. Must match edge.child_creator.
    #[account(mut)]
    pub child_creator: Signer<'info>,

    /// The dependency edge PDA to be closed.
    /// Validated against child_creator in the handler for belt-and-suspenders.
    #[account(
        mut,
        seeds = [
            b"dep_edge",
            dep_edge.parent.as_ref(),
            dep_edge.child.as_ref(),
        ],
        bump = dep_edge.bump,
        constraint = dep_edge.child_creator == child_creator.key() @ RoyaltyRegistryError::Unauthorized,
        close = child_creator,
    )]
    pub dep_edge: Account<'info, DependencyEdge>,

    /// Solana system program.
    pub system_program: Program<'info, System>,
}
