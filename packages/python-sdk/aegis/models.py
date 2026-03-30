"""Data models for Aegis SDK responses."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

@dataclass
class Operator:
    slug: str
    name: str
    category: str
    trust_score: float
    total_invocations: int
    price_per_call: str
    creator_wallet: str
    is_active: bool
    is_verified: bool
    tagline: str = ""
    description: str = ""
    success_rate: float = 0.0
    total_earned: str = "0"
    tags: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Operator:
        earned = d.get("totalEarned", "0")
        if isinstance(earned, dict) and "$numberDecimal" in earned:
            earned = earned["$numberDecimal"]
        return cls(
            slug=d.get("slug", ""),
            name=d.get("name", ""),
            category=d.get("category", ""),
            trust_score=d.get("trustScore", 0),
            total_invocations=d.get("totalInvocations", 0),
            price_per_call=str(d.get("pricePerCall", "0.01")),
            creator_wallet=d.get("creatorWallet", ""),
            is_active=d.get("isActive", False),
            is_verified=d.get("isVerified", False),
            tagline=d.get("tagline", ""),
            description=d.get("description", ""),
            success_rate=d.get("successRate", 0),
            total_earned=str(earned),
            tags=d.get("tags", []),
        )

@dataclass
class Invocation:
    id: int
    operator_id: int
    caller_wallet: str
    amount_paid: str
    response_ms: int
    success: bool
    timestamp: str
    operator_name: str = ""
    trust_delta: float = 0.0

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Invocation:
        amount = d.get("amountPaid", "0")
        if isinstance(amount, dict) and "$numberDecimal" in amount:
            amount = amount["$numberDecimal"]
        return cls(
            id=d.get("id", 0),
            operator_id=d.get("operatorId", 0),
            caller_wallet=d.get("callerWallet", ""),
            amount_paid=str(amount),
            response_ms=d.get("responseMs", 0),
            success=d.get("success", False),
            timestamp=d.get("createdAt", ""),
            operator_name=d.get("operatorName", ""),
            trust_delta=d.get("trustDelta", 0),
        )

@dataclass
class TrustScore:
    overall: float
    execution_reliability: float
    response_quality: float
    schema_compliance: float
    validator_consensus: float
    historical_performance: float

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> TrustScore:
        return cls(
            overall=d.get("overall", 0),
            execution_reliability=d.get("executionReliability", 0),
            response_quality=d.get("responseQuality", 0),
            schema_compliance=d.get("schemaCompliance", 0),
            validator_consensus=d.get("validatorConsensus", 0),
            historical_performance=d.get("historicalPerformance", 0),
        )

@dataclass
class ProtocolStats:
    total_operators: int
    total_invocations: int
    total_revenue: str
    avg_trust_score: float

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> ProtocolStats:
        return cls(
            total_operators=d.get("operators", 0),
            total_invocations=d.get("invocations", 0),
            total_revenue=str(d.get("revenue", "0")),
            avg_trust_score=d.get("avgTrustScore", 0),
        )

@dataclass
class RoyaltyEarnings:
    unclaimed: str
    total_earned: str
    total_claimed: str
    recent_payments: list[dict] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> RoyaltyEarnings:
        return cls(
            unclaimed=str(d.get("unclaimed", "0")),
            total_earned=str(d.get("totalEarned", "0")),
            total_claimed=str(d.get("totalClaimed", "0")),
            recent_payments=d.get("recentPayments", []),
        )
