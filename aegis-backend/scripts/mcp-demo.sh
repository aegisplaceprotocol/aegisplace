#!/bin/bash
# MCP Integration Demo - Shows how any AI agent connects to Aegis

echo "Step 1: Agent discovers Aegis tools"
echo '{"mcpServers":{"aegis":{"url":"https://aegisplace.com/api/mcp"}}}'
echo ""

echo "Step 2: List available tools"
curl -s http://localhost:3000/api/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -c "
import json,sys
tools = json.load(sys.stdin)['result']['tools']
for t in tools:
    print(f'  {t[\"name\"]}: {t[\"description\"][:80]}')
"
echo ""

echo "Step 3: Search for operators"
curl -s http://localhost:3000/api/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"aegis_search_operators","arguments":{"query":"code review","limit":3}}}' | python3 -c "
import json,sys
d = json.load(sys.stdin)
ops = json.loads(d['result']['content'][0]['text'])
items = ops if isinstance(ops, list) else ops.get('results', ops.get('operators', []))
for op in items[:3]:
    price = op.get('pricePerCall', '0.02')
    if isinstance(price, dict):
        price = price.get('\$numberDecimal', '0.02')
    print(f'  {op[\"name\"]} - trust: {op.get(\"trustScore\",\"?\")} - \${price}/call')
"
echo ""

echo "Step 4: Get protocol stats"
curl -s http://localhost:3000/api/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"aegis_get_stats","arguments":{}}}' | python3 -c "
import json,sys
d = json.load(sys.stdin)
stats = json.loads(d['result']['content'][0]['text'])
for k,v in stats.items():
    if isinstance(v, dict):
        for sk,sv in v.items():
            print(f'  {k}.{sk}: {sv}')
    else:
        print(f'  {k}: {v}')
"
echo ""

echo "Step 5: Register as an agent"
AGENT_NAME="HackathonBot-$(date +%s)"
curl -s http://localhost:3000/api/mcp -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"aegis_agent_register\",\"arguments\":{\"name\":\"$AGENT_NAME\",\"walletAddress\":\"DemoWa11etHackathonXXXXXXXXXXXXXXXXXXXXXX\"}}}" | python3 -c "
import json,sys
d = json.load(sys.stdin)
text = d['result']['content'][0]['text']
try:
    result = json.loads(text)
    print(f'  Agent registered: {result.get(\"name\",\"?\")}')
    print(f'  API Key: {result.get(\"apiKey\",\"?\")[:20]}...')
except json.JSONDecodeError:
    print(f'  {text}')
"
echo ""

echo "Done. Agent is connected and ready to invoke skills."
