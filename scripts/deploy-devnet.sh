#!/bin/bash
# Deploy all 3 Aegis programs to Solana Devnet
# Run: bash scripts/deploy-devnet.sh

set -e

echo "=== Aegis Protocol Devnet Deployment ==="
echo ""

DEPLOY_DIR="/root/aegis/aegis-build"
KEYPAIR="${SOLANA_KEYPAIR:-$HOME/.config/solana/id.json}"
DEVNET_URL="https://api.devnet.solana.com"

cd "$DEPLOY_DIR"

# Check balance
echo "Wallet: $(solana-keygen pubkey $KEYPAIR)"
BALANCE=$(solana balance --url $DEVNET_URL 2>&1)
echo "Balance: $BALANCE"

# Airdrop if needed (need ~8 SOL for 3 programs)
echo ""
echo "Requesting airdrops..."
for i in 1 2 3 4; do
  solana airdrop 2 --url $DEVNET_URL 2>&1 || true
  sleep 2
done

echo ""
echo "Balance after airdrops: $(solana balance --url $DEVNET_URL)"
echo ""

# Deploy aegis
echo "=== Deploying aegis ==="
solana program deploy target/deploy/aegis.so \
  --url $DEVNET_URL \
  --keypair $KEYPAIR \
  --program-id target/deploy/aegis-keypair.json
echo ""

# Deploy royalty_registry
echo "=== Deploying royalty_registry ==="
solana program deploy target/deploy/royalty_registry.so \
  --url $DEVNET_URL \
  --keypair $KEYPAIR \
  --program-id target/deploy/royalty_registry-keypair.json
echo ""

# Deploy aegis_governance
echo "=== Deploying aegis_governance ==="
solana program deploy target/deploy/aegis_governance.so \
  --url $DEVNET_URL \
  --keypair $KEYPAIR \
  --program-id target/deploy/aegis_governance-keypair.json
echo ""

# Verify
echo "=== Verification ==="
echo ""
echo "--- aegis ---"
solana program show 7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR --url $DEVNET_URL
echo ""
echo "--- royalty_registry ---"
solana program show FrXBFm4WdqBHosZJ8rMyT9FHNvRXuSVzxqGBbH7nCWs6 --url $DEVNET_URL
echo ""
echo "--- aegis_governance ---"
solana program show 6TwiJJSscSFpSQA1PU8uYoJHGwgxaprEPJSpKfRireSn --url $DEVNET_URL
echo ""

echo "=== Deployment Complete ==="
echo "Program IDs:"
echo "  aegis:            7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR"
echo "  royalty_registry: FrXBFm4WdqBHosZJ8rMyT9FHNvRXuSVzxqGBbH7nCWs6"
echo "  aegis_governance: 6TwiJJSscSFpSQA1PU8uYoJHGwgxaprEPJSpKfRireSn"
