use anchor_lang::prelude::*;

#[error_code]
pub enum AegisError {
    /// Fee basis points must sum to exactly 10000 (100.00%).
    #[msg("Fee basis points must sum to exactly 10000")]
    InvalidFeeBpsSum,

    /// Operator name exceeds the 64-byte maximum.
    #[msg("Operator name exceeds 64 bytes")]
    NameTooLong,

    /// Operator slug exceeds the 64-byte maximum.
    #[msg("Operator slug exceeds 64 bytes")]
    SlugTooLong,

    /// Metadata URI exceeds the 200-byte maximum.
    #[msg("Metadata URI exceeds 200 bytes")]
    MetadataUriTooLong,

    /// Slug contains invalid characters.
    #[msg("Slug must only contain lowercase letters, numbers, and hyphens")]
    InvalidSlug,

    /// The operator is not currently active.
    #[msg("Operator is not active")]
    OperatorNotActive,

    /// The operator is already deactivated.
    #[msg("Operator is already deactivated")]
    OperatorAlreadyDeactivated,

    /// Trust score must be in range 0..=10000.
    #[msg("Trust score out of range (0-10000)")]
    TrustScoreOutOfRange,

    /// Only the protocol admin can perform this action.
    #[msg("Unauthorized: signer is not the admin")]
    Unauthorized,

    /// Arithmetic overflow during fee calculation.
    #[msg("Arithmetic overflow in fee calculation")]
    ArithmeticOverflow,

    /// Individual fee basis point value exceeds 10000.
    #[msg("Individual fee bps exceeds 10000")]
    InvalidFeeBpsValue,

    /// Reserved legacy error variant from the original paid-only pricing model.
    #[msg("Operator price must be greater than zero")]
    ZeroPrice,

    /// Category value is invalid.
    #[msg("Invalid category value")]
    InvalidCategory,

    /// The USDC mint does not match the one stored in protocol config.
    #[msg("USDC mint does not match protocol config")]
    InvalidUsdcMint,

    /// A pool/treasury/insurance account does not match protocol config.
    #[msg("Account does not match protocol config")]
    InvalidPoolAccount,

    /// The operator is inactive.
    #[msg("Operator is inactive")]
    OperatorInactive,

    /// Invalid input provided.
    #[msg("Invalid input: zero address not allowed")]
    InvalidInput,

    /// Account is not owned by the expected program.
    #[msg("Account is not owned by the expected program")]
    InvalidAccount,

    /// Duplicate accounts detected where distinct accounts are required.
    #[msg("Duplicate accounts where distinct accounts are required")]
    DuplicateAccounts,

    /// Operator price must be zero for free operators or at least 10,000 base units ($0.01 USDC).
    #[msg("Operator price must be zero for free listings or meet the minimum paid floor")]
    PriceTooLow,

    /// Trust score delta exceeds the maximum allowed per update (+/- 500).
    #[msg("Trust score delta exceeds maximum allowed per update")]
    TrustDeltaTooLarge,

    /// Operator is already active and cannot be reactivated.
    #[msg("Operator is already active")]
    OperatorAlreadyActive,

    /// Pending admin has not been set - cannot accept admin transfer.
    #[msg("Pending admin has not been set")]
    PendingAdminNotSet,

    /// No single fee may exceed 7000 bps (70%).
    #[msg("Individual fee exceeds maximum of 7000 bps")]
    FeeTooHigh,

    /// Creator fee must be at least 4000 bps (40%).
    #[msg("Creator fee must be at least 4000 bps")]
    CreatorFeeTooLow,

    /// Burn fee must be at least 50 bps (0.5%).
    #[msg("Burn fee must be at least 50 bps")]
    BurnFeeTooLow,

    /// Updating the USDC mint requires replacing all protocol pool token accounts.
    #[msg("Updating the USDC mint requires treasury, validator, staker, and insurance accounts for the new mint")]
    MintMigrationRequiresAllPools,
}
