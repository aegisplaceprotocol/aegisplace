use anchor_lang::prelude::*;

#[error_code]
pub enum AegisError {
    /// Fee basis points must sum to exactly 10000 (100.00%).
    #[msg("Fee basis points must sum to exactly 10000")]
    InvalidFeeBpsSum,

    /// Operator name exceeds the 64-byte maximum.
    #[msg("Operator name exceeds 64 bytes")]
    NameTooLong,

    /// Endpoint URL exceeds the 256-byte maximum.
    #[msg("Endpoint URL exceeds 256 bytes")]
    EndpointUrlTooLong,

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

    /// The operator price must be greater than zero.
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
}
