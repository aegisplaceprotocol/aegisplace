use anchor_lang::prelude::*;
use crate::errors::AegisError;
use crate::events::OperatorRegistered;
use crate::state::{Operator, ProtocolConfig};

/// Registers a new operator (AI agent skill) on the protocol.
///
/// Creates a unique PDA for the operator keyed by [creator, operator_id].
/// The operator_id is derived from the current total_operators counter,
/// ensuring global uniqueness.
pub fn handler(
    ctx: Context<RegisterOperator>,
    name: String,
    slug: String,
    metadata_uri: String,
    price_usdc_base: u64,
    category: u8,
) -> Result<()> {
    // Validate input lengths.
    require!(name.len() <= 64, AegisError::NameTooLong);
    require!(slug.len() <= 64, AegisError::SlugTooLong);
    require!(metadata_uri.len() <= 200, AegisError::MetadataUriTooLong);
    // Free operators are allowed at 0. Paid operators must respect the $0.01 floor.
    require!(price_usdc_base == 0 || price_usdc_base >= 10_000, AegisError::PriceTooLow);
    require!(
        slug
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-'),
        AegisError::InvalidSlug,
    );

    let config = &mut ctx.accounts.config;
    let operator_id = config.total_operators;

    let operator = &mut ctx.accounts.operator;
    operator.creator = ctx.accounts.creator.key();
    operator.operator_id = operator_id;
    operator.name = name.clone();
    operator.slug = slug.clone();
    operator.metadata_uri = metadata_uri.clone();
    operator.price_usdc_base = price_usdc_base;
    operator.category = category;
    operator.trust_score = 5_000; // Start at 50% trust.
    operator.total_invocations = 0;
    operator.successful_invocations = 0;
    operator.total_earned_lamports = 0;
    operator.is_active = true;
    operator.created_at = Clock::get()?.unix_timestamp;
    operator.bump = ctx.bumps.operator;

    // Increment global operator counter.
    config.total_operators = config
        .total_operators
        .checked_add(1)
        .ok_or(AegisError::ArithmeticOverflow)?;

    emit!(OperatorRegistered {
        operator_id,
        creator: operator.creator,
        name,
        slug,
        metadata_uri,
        price_usdc_base,
        category,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RegisterOperator<'info> {
    /// The creator registering the operator. Pays for account creation.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The global protocol configuration. Mutable to increment total_operators.
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, ProtocolConfig>,

    /// The operator PDA to be created. Seeds ensure uniqueness per creator + operator_id.
    #[account(
        init,
        payer = creator,
        space = 8 + Operator::INIT_SPACE,
        seeds = [
            b"operator",
            creator.key().as_ref(),
            config.total_operators.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub operator: Account<'info, Operator>,

    /// Solana system program for account creation.
    pub system_program: Program<'info, System>,
}
