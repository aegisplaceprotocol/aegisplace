use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::errors::RoyaltyRegistryError;
use crate::events::RoyaltyDeposited;
use crate::state::{DependencyEdge, RoyaltyReceipt, RoyaltyVault};

/// Deposits royalties into the parent creator's vault.
///
/// Called by the protocol authority whenever a child skill invocation
/// triggers a royalty payment to a parent skill creator.
///
/// The actual USDC transfer goes from the authority's token account into the
/// protocol-wide royalty escrow token account. The escrow token account is
/// a standalone account whose token-authority is the escrow_authority PDA
/// (seeds=[b"royalty_escrow_auth"]).
///
/// Vault accounting is updated so unclaimed += amount. Creators later call
/// claim_royalties to pull their share from the escrow.
///
/// A RoyaltyReceipt PDA is created for each deposit providing an auditable
/// on-chain record of every payment.
pub fn handler(ctx: Context<DepositRoyalty>, amount: u64, receipt_id: u64) -> Result<()> {
    // Deposits must be non-zero.
    require!(amount > 0, RoyaltyRegistryError::ZeroAmount);

    // Verify the aegis config is owned by the aegis program
    require!(
        ctx.accounts.aegis_config.owner == &crate::aegis_program::ID,
        RoyaltyRegistryError::Unauthorized
    );

    // Read admin pubkey from aegis config (offset 8 for discriminator, then 32 bytes for admin)
    let config_data = ctx.accounts.aegis_config.try_borrow_data()?;
    require!(config_data.len() >= 40, RoyaltyRegistryError::Unauthorized);
    let admin_bytes: [u8; 32] = config_data[8..40]
        .try_into()
        .map_err(|_| RoyaltyRegistryError::Unauthorized)?;
    let admin = Pubkey::new_from_array(admin_bytes);
    require!(
        ctx.accounts.authority.key() == admin,
        RoyaltyRegistryError::Unauthorized
    );

    // Validate parent_creator matches what is stored on the dependency edge.
    require!(
        ctx.accounts.dep_edge.parent_creator == ctx.accounts.parent_creator.key(),
        RoyaltyRegistryError::InvalidParentCreator
    );

    // Transfer USDC from authority's token account into the shared royalty escrow.
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.authority_token_account.to_account_info(),
                to: ctx.accounts.royalty_escrow.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    let now = Clock::get()?.unix_timestamp;

    // Update the parent vault's accounting balances.
    // init_if_needed: initialize fields on first use.
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

    vault.unclaimed = vault
        .unclaimed
        .checked_add(amount)
        .ok_or(RoyaltyRegistryError::ArithmeticOverflow)?;

    vault.total_earned = vault
        .total_earned
        .checked_add(amount)
        .ok_or(RoyaltyRegistryError::ArithmeticOverflow)?;

    // Write the immutable receipt.
    let receipt = &mut ctx.accounts.receipt;
    receipt.child_skill = ctx.accounts.dep_edge.child;
    receipt.parent_skill = ctx.accounts.dep_edge.parent;
    receipt.parent_creator = ctx.accounts.parent_creator.key();
    receipt.amount = amount;
    receipt.invocation_amount = amount;
    receipt.timestamp = now;
    receipt.bump = ctx.bumps.receipt;

    emit!(RoyaltyDeposited {
        child_skill: receipt.child_skill,
        parent_skill: receipt.parent_skill,
        parent_creator: receipt.parent_creator,
        amount,
        receipt_id,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, receipt_id: u64)]
pub struct DepositRoyalty<'info> {
    /// The protocol authority authorizing this deposit. Must sign.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The dependency edge linking child to parent. Provides parent/child pubkeys
    /// and validates parent_creator.
    #[account(
        seeds = [
            b"dep_edge",
            dep_edge.parent.as_ref(),
            dep_edge.child.as_ref(),
        ],
        bump = dep_edge.bump,
    )]
    pub dep_edge: Account<'info, DependencyEdge>,

    /// The parent creator wallet. Must match dep_edge.parent_creator.
    /// CHECK: Validated via inline constraint against dep_edge.parent_creator.
    #[account(
        constraint = parent_creator.key() == dep_edge.parent_creator @ RoyaltyRegistryError::InvalidParentCreator
    )]
    pub parent_creator: AccountInfo<'info>,

    /// The parent creator's royalty vault. Created if it doesn't exist yet.
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + RoyaltyVault::INIT_SPACE,
        seeds = [b"royalty_vault", parent_creator.key().as_ref()],
        bump,
    )]
    pub parent_vault: Account<'info, RoyaltyVault>,

    /// Immutable receipt PDA created for this deposit.
    #[account(
        init,
        payer = authority,
        space = 8 + RoyaltyReceipt::INIT_SPACE,
        seeds = [
            b"royalty_receipt",
            dep_edge.child.as_ref(),
            receipt_id.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub receipt: Account<'info, RoyaltyReceipt>,

    /// The USDC mint. Validated against the known mainnet USDC mint address.
    #[account(
        constraint = usdc_mint.key() == crate::USDC_MINT @ RoyaltyRegistryError::InvalidMint
    )]
    pub usdc_mint: Box<Account<'info, Mint>>,

    /// Authority's USDC token account (source of royalty funds).
    #[account(
        mut,
        constraint = authority_token_account.owner == authority.key(),
        constraint = authority_token_account.mint == usdc_mint.key(),
    )]
    pub authority_token_account: Box<Account<'info, TokenAccount>>,

    /// The shared protocol royalty escrow token account.
    /// This token account's SPL authority is the escrow_authority PDA
    /// (seeds=[b"royalty_escrow_auth"]). Funds held here are claimed by creators.
    #[account(
        mut,
        constraint = royalty_escrow.mint == usdc_mint.key(),
        constraint = royalty_escrow.owner == escrow_authority.key(),
    )]
    pub royalty_escrow: Box<Account<'info, TokenAccount>>,

    /// The PDA that owns (is the SPL token authority of) the royalty_escrow
    /// token account. Seeds: [b"royalty_escrow_auth"].
    /// CHECK: This is a PDA used solely as the token account's SPL authority.
    #[account(
        seeds = [b"royalty_escrow_auth"],
        bump,
    )]
    pub escrow_authority: AccountInfo<'info>,

    /// The aegis protocol config PDA - we validate authority matches its admin.
    /// CHECK: We manually verify the PDA seeds, owner, and read the admin pubkey.
    #[account(
        seeds = [b"config"],
        bump,
        seeds::program = aegis_program.key(),
    )]
    pub aegis_config: AccountInfo<'info>,

    /// The aegis program - validated to be the correct program ID.
    /// CHECK: Validated by address constraint.
    #[account(address = crate::aegis_program::ID)]
    pub aegis_program: AccountInfo<'info>,

    /// SPL Token program.
    pub token_program: Program<'info, Token>,

    /// Solana system program.
    pub system_program: Program<'info, System>,

    /// Rent sysvar.
    pub rent: Sysvar<'info, Rent>,
}
