#!/bin/bash
# ═══════════════════════════════════════════════════════
#  AEGIS PROTOCOL - CLEAN DEPLOY TO NEW VPS
#  Run ON the server as root
# ═══════════════════════════════════════════════════════

set -euo pipefail

DOMAIN="aegisplace.com"
MONGO_USER="aegis_admin"
MONGO_PASS="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 64)"

echo ""
echo "═══ AEGIS SECURE DEPLOY ═══"
echo ""

# System
echo "[1/9] Packages..."
apt-get update -qq && apt-get install -y -qq git curl wget ufw fail2ban unzip > /dev/null 2>&1

# Firewall - ONLY 22, 80, 443
echo "[2/9] Firewall..."
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
echo "y" | ufw enable > /dev/null 2>&1
systemctl enable fail2ban > /dev/null 2>&1 && systemctl start fail2ban

# Node 22
echo "[3/9] Node.js..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
apt-get install -y -qq nodejs > /dev/null 2>&1
npm install -g pnpm pm2 > /dev/null 2>&1

# MongoDB 7 - LOCALHOST ONLY
echo "[4/9] MongoDB (localhost only, auth required)..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg 2>/dev/null
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -qq && apt-get install -y -qq mongodb-org > /dev/null 2>&1

cat > /etc/mongod.conf << 'EOF'
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
net:
  port: 27017
  bindIp: 127.0.0.1
security:
  authorization: enabled
EOF

systemctl enable mongod && systemctl restart mongod
sleep 3
mongosh --eval "use admin; db.createUser({user:'${MONGO_USER}',pwd:'${MONGO_PASS}',roles:[{role:'root',db:'admin'}]})" 2>/dev/null || true

# Caddy - reverse proxy + auto SSL
echo "[5/9] Caddy (SSL)..."
apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https > /dev/null 2>&1
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -qq && apt-get install -y -qq caddy > /dev/null 2>&1

cat > /etc/caddy/Caddyfile << CADDY
${DOMAIN} {
    reverse_proxy 127.0.0.1:3000
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        -Server
    }
}
CADDY
mkdir -p /var/log/caddy
systemctl enable caddy && systemctl restart caddy

# SSH hardening
echo "[6/9] SSH hardening..."
sed -i 's/#\?PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#\?PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl reload sshd

# App user (non-root)
echo "[7/9] App user..."
id -u aegis &>/dev/null || useradd -m -s /bin/bash aegis
mkdir -p /opt/aegis && chown aegis:aegis /opt/aegis

# Environment
echo "[8/9] Environment..."
cat > /opt/aegis/.env << ENVFILE
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
MONGODB_URI=mongodb://${MONGO_USER}:${MONGO_PASS}@127.0.0.1:27017/aegis?authSource=admin
JWT_SECRET=${JWT_SECRET}
AEGIS_TOKEN_MINT=4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS
AEGIS_DEXSCREENER_PAIR=2rdSe3JFrsV3vJJhxx9RywjNdPYpYJD5TJNCwY3KozhA
AEGIS_BAGS_URL=https://bags.fm/4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS
BAGS_API_KEY=YOUR_BAGS_API_KEY_HERE
DISCOVERY_ENABLED=false
ENVFILE
chmod 600 /opt/aegis/.env && chown aegis:aegis /opt/aegis/.env

# Summary
IP=$(curl -s ifconfig.me)
echo "[9/9] Done."
echo ""
echo "═══════════════════════════════════════"
echo "  READY"
echo "═══════════════════════════════════════"
echo ""
echo "  Server:    ${IP}"
echo "  MongoDB:   127.0.0.1 only, auth required"
echo "  Firewall:  22, 80, 443"
echo "  SSH:       key-only"
echo "  Caddy:     ${DOMAIN} → localhost:3000"
echo ""
# Secrets are written to /opt/aegis/.env - retrieve them from there
echo ""
echo "  NEXT:"
echo "  1. DNS: ${DOMAIN} A → ${IP}"
echo "  2. scp -r root@your-server-ip:/root/aegis/aegis-build/* /opt/aegis/"
echo "  3. cd /opt/aegis && chown -R aegis:aegis ."
echo "  4. su aegis -c 'cd /opt/aegis && pnpm install && pnpm run seed:real && pnpm build'"
echo "  5. su aegis -c 'cd /opt/aegis && pm2 start dist/index.js --name aegis && pm2 save'"
echo "  6. pm2 startup (as root, run the command it outputs)"
echo "═══════════════════════════════════════"
