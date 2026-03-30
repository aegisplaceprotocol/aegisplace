use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use crate::errors::AegisError;
use crate::events::ProtocolInitialized;
use crate::state::ProtocolConfig;

/// Initializes the protocol configuration singleton.
///
/// Can only be called once (PDA uniqueness enforces this). Sets the admin,
/// treasury addresses, AEGIS mint, USDC mint, and fee schedule.
///
/// Fee schedule: [creator, validators, stakers, treasury, insurance, burned]
/// Must sum to 10000 (100.00%).
/// Default: [6000, 1500, 1200, 800, 300, 200] = 60/15/12/8/3/2
pub fn handler(ctx: Context<Initialize>, fee_bps: [u16; 6]) -> Result<()> {
    // Validate each individual fee value is within range.
    for &bps in fee_bps.iter() {
        require!(bps <= 10_000, AegisError::InvalidFeeBpsValue);
    }

    // Validate the fee split sums to exactly 100% (10000 bps).
    let total_bps: u16 = fee_bps
        .iter()
        .try_fold(0u16, |acc, &x| acc.checked_add(x))
        .ok_or(AegisError::ArithmeticOverflow)?;
    require!(total_bps == 10_000, AegisError::InvalidFeeBpsSum);

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.treasury = ctx.accounts.treasury.key();
    config.validator_pool = ctx.accounts.validator_pool.key();
    config.staker_pool = ctx.accounts.staker_pool.key();
    config.insurance_fund = ctx.accounts.insurance_fund.key();
    config.aegis_mint = ctx.accounts.aegis_mint.key();
    config.usdc_mint = ctx.accounts.usdc_mint.key();
    config.total_operators = 0;
    config.total_invocations = 0;
    config.total_volume_lamports = 0;
    config.fee_bps = fee_bps;
    config.pending_admin = Pubkey::default();
    config.bump = ctx.bumps.config;

    emit!(ProtocolInitialized {
        admin: config.admin,
        treasury: config.treasury,
        validator_pool: config.validator_pool,
        staker_pool: config.staker_pool,
        insurance_fund: config.insurance_fund,
        aegis_mint: config.aegis_mint,
        usdc_mint: config.usdc_mint,
        fee_bps,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The admin who will control the protocol. Must sign the transaction.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// The protocol configuration PDA. Created exactly once.
    #[account(
        init,
        payer = admin,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, ProtocolConfig>,

    /// The protocol treasury token account. Validated as owned by SPL Token program.
    /// CHECK: Validated as token account owned by SPL Token program
    #[account(
        constraint = treasury.owner == &anchor_spl::token::ID @ AegisError::InvalidAccount
    )]
    pub treasury: AccountInfo<'info>,

    /// The validator reward pool token account. Validated as owned by SPL Token program.
    /// CHECK: Validated as token account owned by SPL Token program
    #[account(
        constraint = validator_pool.owner == &anchor_spl::token::ID @ AegisError::InvalidAccount
    )]
    pub validator_pool: AccountInfo<'info>,

    /// The staker reward pool token account. Validated as owned by SPL Token program.
    /// CHECK: Validated as token account owned by SPL Token program
    #[account(
        constraint = staker_pool.owner == &anchor_spl::token::ID @ AegisError::InvalidAccount
    )]
    pub staker_pool: AccountInfo<'info>,

    /// The insurance fund token account. Validated as owned by SPL Token program.
    /// CHECK: Validated as token account owned by SPL Token program
    #[account(
        constraint = insurance_fund.owner == &anchor_spl::token::ID @ AegisError::InvalidAccount
    )]
    pub insurance_fund: AccountInfo<'info>,

    /// The $AEGIS Token-2022 mint. Deserialized and validated as a Mint account.
    pub aegis_mint: Account<'info, Mint>,

    /// The USDC mint (stored for validation during invocations). Deserialized and validated as a Mint account.
    pub usdc_mint: Account<'info, Mint>,

    /// SPL Token program (required for Mint account deserialization).
    pub token_program: Program<'info, Token>,

    /// Solana system program for account creation.
    pub system_program: Program<'info, System>,
}
