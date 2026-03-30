"""Aegis Protocol Python SDK — invoke AI skills on Solana with USDC settlement."""

from .client import AegisClient
from .models import Operator, Invocation, TrustScore, ProtocolStats, RoyaltyEarnings
from .exceptions import AegisError, AegisNotFoundError, AegisAuthError

__version__ = "1.0.0"
__all__ = [
    "AegisClient",
    "Operator", "Invocation", "TrustScore", "ProtocolStats", "RoyaltyEarnings",
    "AegisError", "AegisNotFoundError", "AegisAuthError",
]
