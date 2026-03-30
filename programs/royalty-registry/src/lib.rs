use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("FrXBFm4WdqBHosZJ8rMyT9FHNvRXuSVzxqGBbH7nCWs6");

/// USDC mint address on Solana mainnet (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v).
pub const USDC_MINT: Pubkey = Pubkey::new_from_array([
    198, 250, 122, 243, 190, 219, 173, 58, 61, 101, 243, 106, 171, 201, 116, 49,
    177, 187, 228, 194, 210, 246, 224, 228, 124, 166, 2, 3, 69, 47, 93, 97,
]);

/// The aegis program ID - used for cross-program PDA and owner validation.
pub mod aegis_program {
    use anchor_lang::prelude::declare_id;
    declare_id!("7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR");
}

/// Royalty Registry - on-chain royalty dependency graph for the Aegis AI Agent Marketplace.
///
/// This program manages:
/// - Dependency edges between skills (child depends on parent)
/// - Royalty vaults accumulating USDC owed to each parent creator
/// - Royalty receipts providing an auditable deposit trail
/// - Creator withdrawals of accumulated royalties
///
/// The deposit flow (off-chain orchestrated):
///   1. Child skill is invoked → aegis program distributes 60% to child creator
///   2. Protocol authority calls deposit_royalty for each parent in the chain
///   3. Funds flow: authority token account → royalty escrow
///   4. Vault accounting updated (unclaimed += amount)
///   5. Creator calls claim_royalties → royalty escrow → creator token account
///
/// All state transitions emit events for off-chain indexing.
#[program]
pub mod royalty_registry {
    use super::*;

    /// Declares that a child skill depends on a parent skill.
    ///
    /// Creates a DependencyEdge PDA (seeds=[b"dep_edge", parent, child]) and
    /// initializes the parent creator's RoyaltyVault if it doesn't exist yet.
    ///
    /// Parameters:
    /// - royalty_bps: basis points to pay parent on each invocation (max 2000 = 20%)
    /// - depth: depth in the dependency tree (1 = direct parent, max 5)
    pub fn register_dependency(
        ctx: Context<RegisterDependency>,
        royalty_bps: u16,
        depth: u8,
    ) -> Result<()> {
        instructions::register_dependency::handler(ctx, royalty_bps, depth)
    }

    /// Removes a previously registered dependency.
    ///
    /// Closes the DependencyEdge PDA and returns lamports to the child creator.
    /// Only the child creator who originally registered the edge can remove it.
    pub fn remove_dependency(ctx: Context<RemoveDependency>) -> Result<()> {
        instructions::remove_dependency::handler(ctx)
    }

    /// Deposits royalties into the parent creator's vault.
    ///
    /// Called by the protocol authority to credit a parent creator after a
    /// child skill invocation. Transfers USDC from the authority's token account
    /// into the shared royalty escrow and updates vault accounting.
    ///
    /// Parameters:
    /// - amount: USDC base units (6 decimals) to deposit
    /// - receipt_id: protocol-assigned unique identifier for this receipt PDA
    pub fn deposit_royalty(
        ctx: Context<DepositRoyalty>,
        amount: u64,
        receipt_id: u64,
    ) -> Result<()> {
        instructions::deposit_royalty::handler(ctx, amount, receipt_id)
    }

    /// Withdraws all accumulated unclaimed royalties to the creator's wallet.
    ///
    /// Transfers the full `vault.unclaimed` balance from the royalty escrow to
    /// the creator's USDC token account using PDA signer authority, then zeroes
    /// out the unclaimed balance.
    pub fn claim_royalties(ctx: Context<ClaimRoyalties>) -> Result<()> {
        instructions::claim_royalties::handler(ctx)
    }
}
