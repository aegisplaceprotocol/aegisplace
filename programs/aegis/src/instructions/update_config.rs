use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::token::spl_token;
use crate::errors::AegisError;
use crate::events::ConfigUpdated;
use crate::state::ProtocolConfig;

pub fn handler(
    ctx: Context<UpdateConfig>,
    new_fee_bps: Option<[u16; 6]>,
    new_treasury: Option<Pubkey>,
    new_validator_pool: Option<Pubkey>,
    new_staker_pool: Option<Pubkey>,
    new_insurance_fund: Option<Pubkey>,
    new_usdc_mint: Option<Pubkey>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if let Some(fees) = new_fee_bps {
        let sum: u32 = fees.iter().map(|&x| x as u32).sum();
        require!(sum == 10000, AegisError::InvalidFeeBpsSum);
        for &f in fees.iter() {
            require!(f <= 10000, AegisError::InvalidFeeBpsValue);
        }
        config.fee_bps = fees;

        // FIX 1: Prevent admin rug pull on fee splits.
        // No single fee can exceed 7000 bps (70%).
        for &f in config.fee_bps.iter() {
            require!(f <= 7000, AegisError::FeeTooHigh);
        }
        // Creator fee (index 0) must be at least 4000 bps (40%).
        require!(config.fee_bps[0] >= 4000, AegisError::CreatorFeeTooLow);
        // Burn fee (index 5) must be at least 50 bps (0.5%).
        require!(config.fee_bps[5] >= 50, AegisError::BurnFeeTooLow);
    }
    if let Some(t) = new_treasury {
        require!(t != Pubkey::default(), AegisError::InvalidInput);
        config.treasury = t;
    }
    if let Some(v) = new_validator_pool {
        require!(v != Pubkey::default(), AegisError::InvalidInput);
        config.validator_pool = v;
    }
    if let Some(s) = new_staker_pool {
        require!(s != Pubkey::default(), AegisError::InvalidInput);
        config.staker_pool = s;
    }
    if let Some(i) = new_insurance_fund {
        require!(i != Pubkey::default(), AegisError::InvalidInput);
        config.insurance_fund = i;
    }

    if let Some(mint) = new_usdc_mint {
        require!(mint != Pubkey::default(), AegisError::InvalidInput);
        require!(
            new_treasury.is_some()
                && new_validator_pool.is_some()
                && new_staker_pool.is_some()
                && new_insurance_fund.is_some(),
            AegisError::MintMigrationRequiresAllPools,
        );
        config.usdc_mint = mint;
    }

    // FIX 2: When updating any pool address, require remaining accounts for validation.
    let expects_pool_validation =
        new_treasury.is_some() || new_validator_pool.is_some() || new_staker_pool.is_some() || new_insurance_fund.is_some();
    if expects_pool_validation {
        require!(ctx.remaining_accounts.len() == 4, AegisError::InvalidAccount);

        validate_token_account(&ctx.remaining_accounts[0], config.treasury, config.usdc_mint)?;
        validate_token_account(&ctx.remaining_accounts[1], config.validator_pool, config.usdc_mint)?;
        validate_token_account(&ctx.remaining_accounts[2], config.staker_pool, config.usdc_mint)?;
        validate_token_account(&ctx.remaining_accounts[3], config.insurance_fund, config.usdc_mint)?;
    }

    emit!(ConfigUpdated {
        admin: config.admin,
        treasury: config.treasury,
        validator_pool: config.validator_pool,
        staker_pool: config.staker_pool,
        insurance_fund: config.insurance_fund,
        usdc_mint: config.usdc_mint,
        fee_bps: config.fee_bps,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

fn validate_token_account(account_info: &AccountInfo, expected_key: Pubkey, expected_mint: Pubkey) -> Result<()> {
    require!(account_info.key() == expected_key, AegisError::InvalidPoolAccount);
    require!(account_info.owner == &anchor_spl::token::ID, AegisError::InvalidAccount);

    let token_account = spl_token::state::Account::unpack(&account_info.try_borrow_data()?)
        .map_err(|_| error!(AegisError::InvalidAccount))?;

    require!(token_account.mint == expected_mint, AegisError::InvalidUsdcMint);
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = admin @ AegisError::Unauthorized,
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub admin: Signer<'info>,
}
