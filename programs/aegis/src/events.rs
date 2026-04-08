use anchor_lang::prelude::*;

/// Emitted when the protocol is initialized.
#[event]
pub struct ProtocolInitialized {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub validator_pool: Pubkey,
    pub staker_pool: Pubkey,
    pub insurance_fund: Pubkey,
    pub aegis_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub fee_bps: [u16; 6],
}

/// Emitted when a new operator is registered.
#[event]
pub struct OperatorRegistered {
    pub operator_id: u64,
    pub creator: Pubkey,
    pub name: String,
    pub slug: String,
    pub metadata_uri: String,
    pub price_usdc_base: u64,
    pub category: u8,
}

/// Emitted when a skill is invoked and payment is distributed (6-way split).
#[event]
pub struct SkillInvoked {
    pub operator_id: u64,
    pub operator: Pubkey,
    pub caller: Pubkey,
    pub amount: u64,
    pub creator_share: u64,
    pub validator_share: u64,
    pub staker_share: u64,
    pub treasury_share: u64,
    pub insurance_share: u64,
    pub burn_share: u64,
    pub invocation_id: u64,
    pub timestamp: i64,
}

/// Emitted when an operator's trust score is updated.
#[event]
pub struct TrustUpdated {
    pub operator_id: u64,
    pub operator: Pubkey,
    pub old_score: u16,
    pub new_score: u16,
    pub delta: i16,
}

/// Emitted when an operator is deactivated.
#[event]
pub struct OperatorDeactivated {
    pub operator_id: u64,
    pub operator: Pubkey,
    pub creator: Pubkey,
}

/// Emitted when the protocol admin is rotated.
#[event]
pub struct AdminRotated {
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
    pub timestamp: i64,
}

/// Emitted when protocol payment rails are updated.
#[event]
pub struct ConfigUpdated {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub validator_pool: Pubkey,
    pub staker_pool: Pubkey,
    pub insurance_fund: Pubkey,
    pub usdc_mint: Pubkey,
    pub fee_bps: [u16; 6],
    pub timestamp: i64,
}
