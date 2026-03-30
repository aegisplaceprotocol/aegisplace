"""LangChain tools for Aegis Protocol."""
from __future__ import annotations
from typing import Any
from .client import AegisClient

def create_aegis_tools(base_url: str = "https://mcp.aegisplace.com", api_key: str | None = None) -> list[dict[str, Any]]:
    """Create LangChain-compatible tool definitions for Aegis Protocol.

    Usage with LangChain:
        from aegis.langchain import create_aegis_tools
        tools = create_aegis_tools()
        agent = initialize_agent(tools=tools, llm=llm)
    """
    client = AegisClient(base_url=base_url, api_key=api_key)

    def list_operators(query: str = "", category: str = "", limit: int = 10) -> str:
        ops, total = client.list_operators(limit=limit, category=category or None, search=query or None)
        lines = [f"{i+1}. {op.name} ({op.category}) — Trust: {op.trust_score}, {op.total_invocations:,} invocations, ${op.price_per_call}/call"
                 for i, op in enumerate(ops)]
        return f"Found {total} operators:\n" + "\n".join(lines)

    def invoke_skill(slug: str, payload: str = "{}") -> str:
        import json
        result = client.invoke_skill(slug, json.loads(payload) if payload != "{}" else None)
        return json.dumps(result, indent=2)

    def get_trust_score(slug: str) -> str:
        score = client.get_trust_score(slug)
        return (f"Trust Report for {slug}:\n"
                f"  Overall: {score.overall}/100\n"
                f"  Execution Reliability: {score.execution_reliability}/100\n"
                f"  Response Quality: {score.response_quality}/100\n"
                f"  Schema Compliance: {score.schema_compliance}/100\n"
                f"  Validator Consensus: {score.validator_consensus}/100\n"
                f"  Historical Performance: {score.historical_performance}/100")

    def protocol_stats() -> str:
        stats = client.get_stats()
        return (f"Aegis Protocol Stats:\n"
                f"  Operators: {stats.total_operators:,}\n"
                f"  Invocations: {stats.total_invocations:,}\n"
                f"  Revenue: ${stats.total_revenue} USDC\n"
                f"  Avg Trust Score: {stats.avg_trust_score}/100")

    return [
        {"name": "aegis_list_operators", "description": "List AI skill operators on Aegis Protocol with optional search and category filter", "func": list_operators},
        {"name": "aegis_invoke_skill", "description": "Invoke an AI skill on Solana via Aegis Protocol with USDC payment", "func": invoke_skill},
        {"name": "aegis_trust_score", "description": "Get the 5-dimensional trust score for an AI skill operator", "func": get_trust_score},
        {"name": "aegis_protocol_stats", "description": "Get Aegis Protocol statistics (operators, invocations, revenue)", "func": protocol_stats},
    ]
