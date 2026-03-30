use anchor_lang::prelude::*;
use crate::errors::AegisError;
use crate::state::ProtocolConfig;

pub fn handler(
    ctx: Context<UpdateConfig>,
    new_fee_bps: Option<[u16; 6]>,
    new_treasury: Option<Pubkey>,
    new_validator_pool: Option<Pubkey>,
    new_staker_pool: Option<Pubkey>,
    new_insurance_fund: Option<Pubkey>,
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
        // Burn fee (index 5) must be at least 100 bps (1%).
        require!(config.fee_bps[5] >= 100, AegisError::BurnFeeTooLow);
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

    // FIX 2: When updating any pool address, require remaining accounts for validation.
    if new_treasury.is_some() || new_validator_pool.is_some() || new_staker_pool.is_some() || new_insurance_fund.is_some() {
        // Require at least one remaining account for validation.
        require!(!ctx.remaining_accounts.is_empty(), AegisError::InvalidAccount);

        // Validate ALL remaining accounts are valid SPL Token accounts.
        for account_info in ctx.remaining_accounts.iter() {
            require!(
                account_info.owner == &anchor_spl::token::ID,
                AegisError::InvalidAccount
            );
            // Also check the account has data (is initialized).
            require!(
                account_info.data_len() >= 165, // TokenAccount is 165 bytes
                AegisError::InvalidAccount
            );
        }
    }

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
