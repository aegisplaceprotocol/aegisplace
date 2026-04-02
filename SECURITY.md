# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Aegis Protocol, please report it responsibly. **Do not open a public GitHub issue.**

### How to Report

Email **security@aegisplace.com** with the following information:

- Description of the vulnerability
- Steps to reproduce
- Affected component(s) (Anchor programs, server, client)
- Potential impact assessment
- Any suggested fixes (optional)

### PGP Encryption

If you need to send sensitive details, request our PGP public key at the email address above.

## Scope

The following components are in scope for security reports:

| Component | Description | Severity |
|-----------|-------------|----------|
| **Anchor Programs** | On-chain Solana programs (`programs/`) | Critical |
| **Server** | Express API, payment processing, guardrails integration (`server/`) | High |
| **Client** | React frontend, wallet interactions (`client/`) | Medium |
| **Infrastructure** | Docker, CI/CD, deployment configurations | Medium |

### Out of Scope

- Third-party dependencies (report upstream, but let us know)
- Social engineering attacks
- Denial of service via rate limiting (already mitigated)
- Issues in test or development environments only

## Bug Bounty

We offer bounties for qualifying security reports based on severity:

| Severity | Examples | Bounty Range |
|----------|----------|--------------|
| **Critical** | Fund theft, private key exposure, program exploit | $1,000 - $10,000 |
| **High** | Authentication bypass, unauthorized data access | $500 - $2,000 |
| **Medium** | XSS, CSRF, information disclosure | $100 - $500 |
| **Low** | Minor misconfigurations, non-sensitive info leaks | Recognition |

Bounty amounts are determined at our discretion based on impact, exploitability, and report quality.

### Eligibility

- First reporter of a given vulnerability receives the bounty.
- You must not exploit the vulnerability beyond what is necessary to demonstrate it.
- You must not access, modify, or delete other users' data.
- You must allow reasonable time for a fix before any public disclosure.

## Response Timeline

| Stage | Timeframe |
|-------|-----------|
| **Acknowledgment** | Within 48 hours of report |
| **Initial assessment** | Within 5 business days |
| **Status update** | Within 10 business days |
| **Fix deployed** | Depends on severity (critical: ASAP, high: 2 weeks, medium: 30 days) |
| **Public disclosure** | After fix is deployed, coordinated with reporter |

## Disclosure Policy

We follow a coordinated disclosure process:

1. Reporter submits the vulnerability privately.
2. We acknowledge receipt and begin investigation.
3. We develop and test a fix.
4. We deploy the fix and notify affected users if necessary.
5. We coordinate with the reporter on public disclosure timing.
6. Credit is given to the reporter (unless they prefer anonymity).

## Security Practices

Aegis Protocol maintains the following security practices:

- All skill invocations pass through NVIDIA NeMo Guardrails for input/output safety.
- On-chain settlement uses audited Anchor programs with slashable bond mechanics.
- CI/CD pipelines scan for hardcoded secrets and vulnerable dependencies.
- Server endpoints enforce authentication and rate limiting.
- Wallet interactions use standard Solana wallet adapter security patterns.

## Contact

- **Security reports:** security@aegisplace.com
- **General inquiries:** https://aegisplace.com

Thank you for helping keep Aegis Protocol secure.
