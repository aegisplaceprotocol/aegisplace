#!/bin/bash
# Deploy all 3 Aegis programs to Solana Devnet.
# WSL: bash aegis-backend/scripts/deploy-devnet.sh

set -e

echo "=== Aegis Protocol Devnet Deployment ==="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
KEYPAIR="${SOLANA_KEYPAIR:-$HOME/.config/solana/id.json}"
DEVNET_URL="https://api.devnet.solana.com"
AEGIS_PROGRAM_ID="HiDGqc9NX4dbERfqAyq2skF3Tk5vWEjXwsrrtSWxi19v"
ROYALTY_PROGRAM_ID="8KAWrDAwgGihNr49VRu2Wvsf8n1dHkjFtUt53M1D9T7a"
GOVERNANCE_PROGRAM_ID="G15ETEBeHKaCvfDHmpdE9o6XEfy3bBDCGcG5kAsGXdrD"

cd "$REPO_ROOT"

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
solana program show $AEGIS_PROGRAM_ID --url $DEVNET_URL
echo ""
echo "--- royalty_registry ---"
solana program show $ROYALTY_PROGRAM_ID --url $DEVNET_URL
echo ""
echo "--- aegis_governance ---"
solana program show $GOVERNANCE_PROGRAM_ID --url $DEVNET_URL
echo ""

echo "=== Deployment Complete ==="
echo "Program IDs:"
echo "  aegis:            $AEGIS_PROGRAM_ID"
echo "  royalty_registry: $ROYALTY_PROGRAM_ID"
echo "  aegis_governance: $GOVERNANCE_PROGRAM_ID"
