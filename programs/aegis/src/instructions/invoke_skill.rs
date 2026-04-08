use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::errors::AegisError;
use crate::events::SkillInvoked;
use crate::state::{InvocationReceipt, Operator, ProtocolConfig};

/// Invokes an operator's skill, distributing the payment to protocol recipients.
///
/// The caller pays the operator's price in USDC. The payment is immediately
/// split according to the protocol fee schedule:
///   - 85% to the skill creator
///   - 10% to the validator pool
///   - 3%  to the dynamic treasury
///   - 1.5% to the insurance fund
///   - 0.5% burned (permanently removed from supply)
///   - the staker slot is currently configured to 0 bps
///
/// The burned portion absorbs rounding dust so total out == total in.
/// An InvocationReceipt PDA is created to record the transaction on-chain.
pub fn handler(ctx: Context<InvokeSkill>) -> Result<()> {
    let operator = &ctx.accounts.operator;

    // Operator must be active to accept invocations.
    require!(operator.is_active, AegisError::OperatorNotActive);
    // Safety net: enforce minimum price floor even at invocation time.
    require!(operator.price_usdc_base >= 10_000, AegisError::PriceTooLow);

    let config = &ctx.accounts.config;
    let amount = operator.price_usdc_base;
    let fee_bps = config.fee_bps;

    // Calculate fee splits using u128 intermediate arithmetic.
    // fee_bps: [creator, validators, stakers, treasury, insurance, burned]
    let creator_share = (amount as u128)
        .checked_mul(fee_bps[0] as u128)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_div(10_000)
        .ok_or(AegisError::ArithmeticOverflow)? as u64;

    let validator_share = (amount as u128)
        .checked_mul(fee_bps[1] as u128)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_div(10_000)
        .ok_or(AegisError::ArithmeticOverflow)? as u64;

    let staker_share = (amount as u128)
        .checked_mul(fee_bps[2] as u128)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_div(10_000)
        .ok_or(AegisError::ArithmeticOverflow)? as u64;

    let treasury_share = (amount as u128)
        .checked_mul(fee_bps[3] as u128)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_div(10_000)
        .ok_or(AegisError::ArithmeticOverflow)? as u64;

    let insurance_share = (amount as u128)
        .checked_mul(fee_bps[4] as u128)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_div(10_000)
        .ok_or(AegisError::ArithmeticOverflow)? as u64;

    // Burned share absorbs rounding dust so total out == total in.
    let burn_share = amount
        .checked_sub(creator_share)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_sub(validator_share)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_sub(staker_share)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_sub(treasury_share)
        .ok_or(AegisError::ArithmeticOverflow)?
        .checked_sub(insurance_share)
        .ok_or(AegisError::ArithmeticOverflow)?;

    // Transfer USDC: caller -> creator
    if creator_share > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.caller_token_account.to_account_info(),
                    to: ctx.accounts.creator_token_account.to_account_info(),
                    authority: ctx.accounts.caller.to_account_info(),
                },
            ),
            creator_share,
        )?;
    }

    // Transfer USDC: caller -> validator pool
    if validator_share > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.caller_token_account.to_account_info(),
                    to: ctx.accounts.validator_pool_token_account.to_account_info(),
                    authority: ctx.accounts.caller.to_account_info(),
                },
            ),
            validator_share,
        )?;
    }

    // Transfer USDC: caller -> staker pool (currently 0 bps by config)
    if staker_share > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.caller_token_account.to_account_info(),
                    to: ctx.accounts.staker_pool_token_account.to_account_info(),
                    authority: ctx.accounts.caller.to_account_info(),
                },
            ),
            staker_share,
        )?;
    }

    // Transfer USDC: caller -> treasury
    if treasury_share > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.caller_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.caller.to_account_info(),
                },
            ),
            treasury_share,
        )?;
    }

    // Transfer USDC: caller -> insurance fund
    if insurance_share > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.caller_token_account.to_account_info(),
                    to: ctx.accounts.insurance_fund_token_account.to_account_info(),
                    authority: ctx.accounts.caller.to_account_info(),
                },
            ),
            insurance_share,
        )?;
    }

    // Burn the burn share (actual on-chain burn, not transfer to treasury)
    if burn_share > 0 {
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.usdc_mint.to_account_info(),
                    from: ctx.accounts.caller_token_account.to_account_info(),
                    authority: ctx.accounts.caller.to_account_info(),
                },
            ),
            burn_share,
        )?;
    }

    // Record the invocation receipt.
    let now = Clock::get()?.unix_timestamp;
    let invocation_id = ctx.accounts.operator.total_invocations;

    let receipt = &mut ctx.accounts.receipt;
    receipt.operator = ctx.accounts.operator.key();
    receipt.caller = ctx.accounts.caller.key();
    receipt.amount_paid = amount;
    receipt.response_ms = 0; // Updated off-chain by validator.
    receipt.success = true;  // Optimistic - updated by trust oracle if needed.
    receipt.trust_delta = 0; // Updated by trust oracle.
    receipt.timestamp = now;
    receipt.bump = ctx.bumps.receipt;

    // Update operator counters.
    let operator = &mut ctx.accounts.operator;
    operator.total_invocations = operator
        .total_invocations
        .checked_add(1)
        .ok_or(AegisError::ArithmeticOverflow)?;
    operator.successful_invocations = operator
        .successful_invocations
        .checked_add(1)
        .ok_or(AegisError::ArithmeticOverflow)?;
    operator.total_earned_lamports = operator
        .total_earned_lamports
        .checked_add(creator_share)
        .ok_or(AegisError::ArithmeticOverflow)?;

    // Update global counters.
    let config = &mut ctx.accounts.config;
    config.total_invocations = config
        .total_invocations
        .checked_add(1)
        .ok_or(AegisError::ArithmeticOverflow)?;
    config.total_volume_lamports = config
        .total_volume_lamports
        .checked_add(amount)
        .ok_or(AegisError::ArithmeticOverflow)?;

    emit!(SkillInvoked {
        operator_id: operator.operator_id,
        operator: operator.key(),
        caller: ctx.accounts.caller.key(),
        amount,
        creator_share,
        validator_share,
        staker_share,
        treasury_share,
        insurance_share,
        burn_share,
        invocation_id,
        timestamp: now,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InvokeSkill<'info> {
    /// The caller invoking the skill. Signs and authorizes USDC transfers.
    #[account(mut)]
    pub caller: Signer<'info>,

    /// The global protocol configuration. Mutable to update counters.
    /// Boxed to reduce stack usage with 6-way split.
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Box<Account<'info, ProtocolConfig>>,

    /// The operator being invoked. Must be active. PDA verified via seeds.
    #[account(
        mut,
        seeds = [b"operator", operator.creator.as_ref(), operator.operator_id.to_le_bytes().as_ref()],
        bump = operator.bump,
        constraint = operator.is_active @ AegisError::OperatorInactive,
    )]
    pub operator: Box<Account<'info, Operator>>,

    /// The invocation receipt PDA. Created for each invocation.
    #[account(
        init,
        payer = caller,
        space = 8 + InvocationReceipt::INIT_SPACE,
        seeds = [
            b"invocation",
            operator.key().as_ref(),
            operator.total_invocations.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub receipt: Box<Account<'info, InvocationReceipt>>,

    /// The USDC mint. Validated against the stored config.usdc_mint.
    #[account(
        mut,
        constraint = usdc_mint.key() == config.usdc_mint @ AegisError::InvalidUsdcMint,
    )]
    pub usdc_mint: Box<Account<'info, Mint>>,

    /// Caller's USDC token account (source of funds).
    #[account(
        mut,
        constraint = caller_token_account.owner == caller.key(),
        constraint = caller_token_account.mint == usdc_mint.key(),
    )]
    pub caller_token_account: Box<Account<'info, TokenAccount>>,

    /// Creator's USDC token account (receives 60% creator share).
    #[account(
        mut,
        constraint = creator_token_account.owner == operator.creator,
        constraint = creator_token_account.mint == usdc_mint.key(),
        constraint = creator_token_account.key() != validator_pool_token_account.key() @ AegisError::DuplicateAccounts,
        constraint = creator_token_account.key() != staker_pool_token_account.key() @ AegisError::DuplicateAccounts,
        constraint = creator_token_account.key() != treasury_token_account.key() @ AegisError::DuplicateAccounts,
        constraint = creator_token_account.key() != insurance_fund_token_account.key() @ AegisError::DuplicateAccounts,
    )]
    pub creator_token_account: Box<Account<'info, TokenAccount>>,

    /// Validator pool's USDC token account (receives 15% validator share).
    #[account(
        mut,
        constraint = validator_pool_token_account.key() == config.validator_pool @ AegisError::InvalidPoolAccount,
        constraint = validator_pool_token_account.key() != staker_pool_token_account.key() @ AegisError::DuplicateAccounts,
        constraint = validator_pool_token_account.key() != treasury_token_account.key() @ AegisError::DuplicateAccounts,
        constraint = validator_pool_token_account.key() != insurance_fund_token_account.key() @ AegisError::DuplicateAccounts,
    )]
    pub validator_pool_token_account: Box<Account<'info, TokenAccount>>,

    /// Staker pool's USDC token account (receives 12% staker share).
    #[account(
        mut,
        constraint = staker_pool_token_account.key() == config.staker_pool @ AegisError::InvalidPoolAccount,
        constraint = staker_pool_token_account.key() != treasury_token_account.key() @ AegisError::DuplicateAccounts,
        constraint = staker_pool_token_account.key() != insurance_fund_token_account.key() @ AegisError::DuplicateAccounts,
    )]
    pub staker_pool_token_account: Box<Account<'info, TokenAccount>>,

    /// Treasury's USDC token account (receives 8% treasury share).
    #[account(
        mut,
        constraint = treasury_token_account.key() == config.treasury @ AegisError::InvalidPoolAccount,
        constraint = treasury_token_account.key() != insurance_fund_token_account.key() @ AegisError::DuplicateAccounts,
    )]
    pub treasury_token_account: Box<Account<'info, TokenAccount>>,

    /// Insurance fund's USDC token account (receives 3% insurance share).
    #[account(
        mut,
        constraint = insurance_fund_token_account.key() == config.insurance_fund @ AegisError::InvalidPoolAccount,
    )]
    pub insurance_fund_token_account: Box<Account<'info, TokenAccount>>,

    /// SPL Token program for CPI transfers and burns.
    pub token_program: Program<'info, Token>,

    /// Solana system program for account creation.
    pub system_program: Program<'info, System>,
}
