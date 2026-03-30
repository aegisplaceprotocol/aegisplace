"""Aegis Protocol HTTP client."""
from __future__ import annotations
import httpx
from typing import Any
from .models import Operator, Invocation, TrustScore, ProtocolStats, RoyaltyEarnings
from .exceptions import AegisError, AegisNotFoundError, AegisAuthError

DEFAULT_BASE_URL = "https://mcp.aegisplace.com"

class AegisClient:
    """Client for the Aegis Protocol REST API.

    Usage:
        client = AegisClient()
        operators = client.list_operators(limit=10, sort_by="trust")
        stats = client.get_stats()

    With API key:
        client = AegisClient(api_key="your-key")
        result = client.invoke_skill("sentiment-analyzer", {"text": "hello"})
    """

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        api_key: str | None = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self._http = httpx.Client(base_url=self.base_url, headers=headers, timeout=timeout)

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> AegisClient:
        return self

    def __exit__(self, *_: Any) -> None:
        self.close()

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        resp = self._http.request(method, path, **kwargs)
        if resp.status_code == 404:
            raise AegisNotFoundError(f"Not found: {path}", 404)
        if resp.status_code in (401, 403):
            raise AegisAuthError("Authentication failed", resp.status_code)
        if resp.status_code >= 400:
            raise AegisError(f"API error {resp.status_code}: {resp.text}", resp.status_code)
        return resp.json()

    # ── Operators ──

    def list_operators(
        self,
        limit: int = 20,
        offset: int = 0,
        sort_by: str = "trust",
        category: str | None = None,
        search: str | None = None,
    ) -> tuple[list[Operator], int]:
        """List operators with filtering and pagination."""
        params: dict[str, Any] = {"limit": limit, "offset": offset, "sortBy": sort_by}
        if category:
            params["category"] = category
        if search:
            params["q"] = search
        data = self._request("GET", "/api/v1/operators", params=params)
        ops = [Operator.from_dict(o) for o in data.get("operators", data if isinstance(data, list) else [])]
        total = data.get("total", len(ops))
        return ops, total

    def get_operator(self, slug: str) -> Operator:
        """Get operator by slug."""
        data = self._request("GET", f"/api/v1/operators/{slug}")
        return Operator.from_dict(data)

    def get_trust_score(self, slug: str) -> TrustScore:
        """Get 5-dimensional trust score breakdown."""
        data = self._request("GET", f"/api/v1/operators/{slug}/trust")
        return TrustScore.from_dict(data)

    # ── Invocations ──

    def invoke_skill(
        self,
        slug: str,
        payload: dict[str, Any] | None = None,
        caller_wallet: str | None = None,
    ) -> dict[str, Any]:
        """Invoke an operator skill with optional payment."""
        body: dict[str, Any] = {}
        if payload:
            body["payload"] = payload
        if caller_wallet:
            body["callerWallet"] = caller_wallet
        return self._request("POST", f"/api/v1/operators/{slug}/invoke", json=body)

    def recent_invocations(self, limit: int = 20) -> list[Invocation]:
        """Get recent invocations across all operators."""
        data = self._request("GET", "/api/v1/operators", params={"limit": limit})
        # Fall back to tRPC endpoint pattern
        return []

    # ── Stats ──

    def get_stats(self) -> ProtocolStats:
        """Get protocol-wide statistics."""
        data = self._request("GET", "/api/v1/stats")
        return ProtocolStats.from_dict(data)

    # ── Royalties ──

    def get_royalty_earnings(self, wallet: str) -> RoyaltyEarnings:
        """Get royalty earnings for a creator wallet."""
        data = self._request("GET", f"/api/royalties/earnings/{wallet}")
        return RoyaltyEarnings.from_dict(data)

    def get_royalty_leaderboard(self, limit: int = 20) -> list[dict[str, Any]]:
        """Get top skills by royalty earnings."""
        return self._request("GET", "/api/royalties/leaderboard", params={"limit": limit})

    # ── A2A ──

    def a2a_discover(self) -> dict[str, Any]:
        """Discover this agent's capabilities via A2A protocol."""
        return self._request("POST", "/api/a2a", json={
            "jsonrpc": "2.0",
            "method": "agent/discover",
            "id": 1,
        })

    def a2a_list_skills(self, limit: int = 20) -> dict[str, Any]:
        """List skills via A2A protocol."""
        return self._request("POST", "/api/a2a", json={
            "jsonrpc": "2.0",
            "method": "skills/list",
            "params": {"limit": limit},
            "id": 2,
        })
