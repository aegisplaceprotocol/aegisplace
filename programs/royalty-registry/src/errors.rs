use anchor_lang::prelude::*;

#[error_code]
pub enum RoyaltyRegistryError {
    /// Royalty basis points exceed the maximum of 2000 (20%).
    #[msg("Royalty bps exceeds maximum of 2000 (20%)")]
    RoyaltyBpsTooHigh,

    /// A DependencyEdge PDA between these two skills already exists.
    #[msg("Dependency edge already exists between parent and child")]
    DependencyAlreadyExists,

    /// The signer is not authorized to perform this action.
    #[msg("Unauthorized: signer is not the child creator or vault creator")]
    Unauthorized,

    /// The dependency tree depth would exceed 5 levels.
    #[msg("Dependency tree depth exceeds maximum of 5")]
    MaxDepthExceeded,

    /// A skill cannot declare itself as a dependency.
    #[msg("Self-dependency: parent and child cannot be the same skill")]
    SelfDependency,

    /// The vault's unclaimed balance is insufficient for the requested claim.
    #[msg("Insufficient vault balance to satisfy claim")]
    InsufficientVaultBalance,

    /// Arithmetic overflow during a calculation.
    #[msg("Arithmetic overflow in calculation")]
    ArithmeticOverflow,

    /// The royalty vault PDA has not been initialized yet.
    #[msg("Royalty vault has not been initialized")]
    VaultNotFound,

    /// Deposit amount must be greater than zero.
    #[msg("Deposit amount must be greater than zero")]
    ZeroAmount,

    /// The provided parent_creator does not match the stored value on the edge.
    #[msg("Provided parent_creator does not match stored edge data")]
    InvalidParentCreator,

    /// The operator account is not a valid aegis Operator PDA.
    #[msg("Invalid dependency: operator account is not owned by the aegis program")]
    InvalidDependency,

    /// The provided mint is not the expected USDC mint.
    #[msg("Invalid mint: expected USDC mint address")]
    InvalidMint,
}
