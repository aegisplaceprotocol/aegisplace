use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::errors::RoyaltyRegistryError;
use crate::events::RoyaltyClaimed;
use crate::state::RoyaltyVault;

/// Withdraws all accumulated unclaimed royalties to the creator's wallet.
///
/// The full `vault.unclaimed` balance is transferred from the protocol royalty
/// escrow to the creator's personal USDC token account. The escrow_authority PDA
/// (seeds=[b"royalty_escrow_auth"]) signs the transfer as the token account owner.
///
/// After a successful claim the vault's `unclaimed` field is zeroed out and
/// `total_claimed` / `last_claim_at` are updated.
///
/// Security:
/// - creator must sign
/// - vault.creator must match the signer (enforced by constraint)
/// - unclaimed must be > 0
pub fn handler(ctx: Context<ClaimRoyalties>) -> Result<()> {
    let claim_amount = ctx.accounts.vault.unclaimed;

    // Nothing to claim.
    require!(claim_amount > 0, RoyaltyRegistryError::InsufficientVaultBalance);

    // Build the PDA signer for the escrow_authority.
    let escrow_auth_bump = ctx.bumps.escrow_authority;
    let escrow_seeds: &[&[u8]] = &[b"royalty_escrow_auth", &[escrow_auth_bump]];
    let signer_seeds = &[escrow_seeds];

    // Transfer USDC from royalty escrow to creator using escrow_authority PDA signer.
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.royalty_escrow.to_account_info(),
                to: ctx.accounts.creator_token_account.to_account_info(),
                authority: ctx.accounts.escrow_authority.to_account_info(),
            },
            signer_seeds,
        ),
        claim_amount,
    )?;

    let now = Clock::get()?.unix_timestamp;

    // Update vault accounting.
    let vault = &mut ctx.accounts.vault;
    vault.total_claimed = vault
        .total_claimed
        .checked_add(claim_amount)
        .ok_or(RoyaltyRegistryError::ArithmeticOverflow)?;
    vault.last_claim_at = now;
    vault.unclaimed = 0;

    emit!(RoyaltyClaimed {
        creator: ctx.accounts.creator.key(),
        amount: claim_amount,
        remaining_unclaimed: 0,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimRoyalties<'info> {
    /// The creator claiming their accumulated royalties. Must sign.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The creator's royalty vault PDA. Validated: vault.creator == creator.
    #[account(
        mut,
        seeds = [b"royalty_vault", creator.key().as_ref()],
        bump = vault.bump,
        constraint = vault.creator == creator.key() @ RoyaltyRegistryError::Unauthorized,
    )]
    pub vault: Account<'info, RoyaltyVault>,

    /// The USDC mint. Validated against the known mainnet USDC mint address.
    #[account(
        constraint = usdc_mint.key() == crate::USDC_MINT @ RoyaltyRegistryError::InvalidMint
    )]
    pub usdc_mint: Box<Account<'info, Mint>>,

    /// Creator's personal USDC token account (destination of claimed funds).
    #[account(
        mut,
        constraint = creator_token_account.owner == creator.key(),
        constraint = creator_token_account.mint == usdc_mint.key(),
    )]
    pub creator_token_account: Box<Account<'info, TokenAccount>>,

    /// The shared protocol royalty escrow token account (source of funds).
    /// Its SPL authority is the escrow_authority PDA.
    #[account(
        mut,
        constraint = royalty_escrow.mint == usdc_mint.key(),
        constraint = royalty_escrow.owner == escrow_authority.key(),
    )]
    pub royalty_escrow: Box<Account<'info, TokenAccount>>,

    /// The PDA that owns (is the SPL token authority of) the royalty_escrow
    /// token account. Signs the transfer CPI.
    /// CHECK: This is a PDA used solely as the token account's SPL authority.
    #[account(
        seeds = [b"royalty_escrow_auth"],
        bump,
    )]
    pub escrow_authority: AccountInfo<'info>,

    /// SPL Token program.
    pub token_program: Program<'info, Token>,

    /// Solana system program.
    pub system_program: Program<'info, System>,
}
