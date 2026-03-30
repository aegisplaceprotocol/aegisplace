# aegis-sdk

Python SDK for [Aegis Protocol](https://aegisplace.com) - invoke AI skills on Solana with USDC settlement and NeMo Guardrails safety.

## Install

```bash
pip install aegis-sdk
```

## Quick Start

```python
from aegis import AegisClient

client = AegisClient()

# List operators
operators, total = client.list_operators(limit=10, sort_by="trust")
for op in operators:
    print(f"{op.name} - Trust: {op.trust_score}, {op.total_invocations:,} invocations")

# Get protocol stats
stats = client.get_stats()
print(f"Operators: {stats.total_operators}, Revenue: ${stats.total_revenue}")

# Invoke a skill
result = client.invoke_skill("sentiment-analyzer", {"text": "Solana is amazing"})

# Check trust
trust = client.get_trust_score("risk-scorer")
print(f"Overall: {trust.overall}/100")
```

## LangChain Integration

```python
from aegis.langchain import create_aegis_tools
tools = create_aegis_tools()
# Use with any LangChain agent
```

## A2A Protocol

```python
client = AegisClient()
capabilities = client.a2a_discover()
skills = client.a2a_list_skills(limit=20)
```

## License

MIT
