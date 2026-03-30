#!/bin/bash
# AEGIS PROTOCOL - Live Demo Script
# Run this to prove everything works end-to-end

echo "╔══════════════════════════════════════════════╗"
echo "║     AEGIS PROTOCOL - LIVE DEMO              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

BASE="http://localhost:3000"

echo "━━━ 1. HEALTH CHECK ━━━"
curl -s $BASE/api/health | python3 -m json.tool
echo ""

echo "━━━ 2. OPERATOR SEARCH (security) ━━━"
curl -s "$BASE/api/v1/operators?q=security&limit=3" | python3 -c "
import json,sys
d = json.load(sys.stdin)
print(f'Found {d[\"total\"]} operators matching \"security\"')
for op in d['operators'][:3]:
    print(f'  [{op[\"category\"]}] {op[\"name\"]} - \${op.get(\"price\",{}).get(\"\$numberDecimal\",\"0.02\")}/call - trust: {op[\"trustScore\"]}')
"
echo ""

echo "━━━ 3. CATEGORIES ━━━"
curl -s $BASE/api/v1/categories | python3 -c "
import json,sys
cats = json.load(sys.stdin)['categories']
for c in cats[:6]:
    print(f'  {c[\"name\"]}: {c[\"count\"]} operators')
print(f'  ... {len(cats)} categories total')
"
echo ""

echo "━━━ 4. x402 PAYMENT REQUIRED ━━━"
echo "POST /api/v1/operators/rpc-load-balancer/invoke (no payment)"
STATUS=$(curl -s -o /tmp/x402.json -w "%{http_code}" -X POST $BASE/api/v1/operators/rpc-load-balancer/invoke)
echo "HTTP Status: $STATUS (should be 402)"
python3 -c "
import json
d = json.load(open('/tmp/x402.json'))
print(f'x402 Version: {d[\"x402Version\"]}')
print(f'Network: {d[\"accepts\"][0][\"network\"]}')
print(f'Amount: {d[\"accepts\"][0][\"amount\"]} atomic USDC')
print(f'Asset: {d[\"accepts\"][0][\"asset\"]}')
print(f'Pay to: {d[\"accepts\"][0][\"payTo\"]}')
"
echo ""

echo "━━━ 5. x402 PAYMENT-REQUIRED HEADER ━━━"
curl -sI -X POST $BASE/api/v1/operators/rpc-load-balancer/invoke | grep "PAYMENT-REQUIRED" | cut -c1-80
echo "... (base64 encoded payment instructions)"
echo ""

echo "━━━ 6. MCP TOOLS (16) ━━━"
curl -s $BASE/api/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -c "
import json,sys
tools = json.load(sys.stdin)['result']['tools']
print(f'{len(tools)} MCP tools available:')
for t in tools:
    print(f'  {t[\"name\"]}')
"
echo ""

echo "━━━ 7. MCP OPERATOR LOOKUP ━━━"
curl -s $BASE/api/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"aegis_get_operator","arguments":{"slug":"rpc-load-balancer"}}}' | python3 -c "
import json,sys
d = json.load(sys.stdin)
op = json.loads(d['result']['content'][0]['text'])
print(f'Operator: {op[\"name\"]}')
print(f'Category: {op[\"category\"]}')
print(f'Trust: {op[\"trustScore\"]}')
print(f'Invocations: {op.get(\"totalInvocations\",0):,}')
"
echo ""

echo "━━━ 8. TRUST SCORE (5 dimensions) ━━━"
# Get operator ID first
OPID=$(curl -s $BASE/api/mcp -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"aegis_get_operator","arguments":{"slug":"rpc-load-balancer"}}}' | python3 -c "
import json,sys
d = json.load(sys.stdin)
op = json.loads(d['result']['content'][0]['text'])
print(op.get('id', op.get('_id','')))
" 2>/dev/null)

curl -s $BASE/api/mcp -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"aegis_get_trust_score\",\"arguments\":{\"operatorId\":\"$OPID\"}}}" | python3 -c "
import json,sys
d = json.load(sys.stdin)
trust = json.loads(d['result']['content'][0]['text'])['trust']
print(f'Overall: {trust[\"overall\"]}/100')
print(f'  Response Quality: {trust[\"responseQuality\"]}%')
print(f'  Guardrail Pass:   {trust[\"guardrailPassRate\"]}%')
print(f'  Uptime:           {trust[\"uptimeRate\"]}%')
print(f'  Review Score:     {trust[\"reviewScore\"]}%')
print(f'  Dispute Rate:     {trust[\"disputeRate\"]}%')
"
echo ""

echo "━━━ 9. DISCOVERY FILES ━━━"
echo "A2A Agent Card:"
curl -s $BASE/.well-known/agent-card.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  {d[\"name\"]} - {len(d[\"skills\"])} skills')"
echo "Skills.json:"
curl -s $BASE/.well-known/skills.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  {d[\"name\"]} - {len(d[\"skills\"])} skills')" 2>/dev/null || echo "  (not available)"
echo "llms.txt: $(curl -s $BASE/llms.txt | head -1)"
echo "robots.txt: $(curl -s $BASE/robots.txt | head -1)"
echo "sitemap.xml: $(curl -s $BASE/sitemap.xml | head -1)"
echo ""

echo "━━━ 10. SECURITY HEADERS ━━━"
curl -sI $BASE/ | grep -iE "strict-transport|x-content|x-frame|referrer|permissions|content-security" | sed 's/:.*//' | while read h; do echo "  ✓ $h"; done
echo ""

echo "━━━ 11. PROTOCOL STATS ━━━"
curl -s $BASE/api/v1/stats | python3 -c "
import json,sys
s = json.load(sys.stdin)
print(f'Operators:    {s[\"operators\"]:,}')
print(f'Invocations:  {s[\"invocations\"]:,}')
print(f'Revenue:      \${float(s[\"revenue\"]):,.2f}')
print(f'Avg Trust:    {s[\"avgTrustScore\"]}')
print(f'Avg Cost:     \${s[\"avgCostPerCall\"]}/call')
print(f'Settlement:   {s[\"settlementTime\"]} on {s[\"settlementChain\"]}')
print(f'Protocols:    {\" + \".join(s[\"protocols\"])}')
"
echo ""

echo "╔══════════════════════════════════════════════╗"
echo "║  Every agent call. Verified. Paid. Receipted.║"
echo "╚══════════════════════════════════════════════╝"
