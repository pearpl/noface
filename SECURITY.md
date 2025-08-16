# Security Policy

## Supported Versions

The project tracks only the latest commit on `main` for security fixes. Please update before reporting an issue to ensure it still exists.

## Reporting a Vulnerability

1. DO NOT create a public issue for potential vulnerabilities (esp. privacy bypass, XSS, RCE in build scripts, supply chain risks).
2. Email: security@noface.local (replace with a real address) with:
   - Description & potential impact
   - Steps / PoC (minimal reproduction)
   - Affected files / commit hash
   - Suggested remediation (if any)
3. You will receive an acknowledgement within 72 hours.
4. Responsible disclosure is appreciated; please allow up to 30 days for a fix before any public discussion.

## Scope

In scope:
- Client-side face anonymization logic (`src/utils`, `src/components`)
- Counter API endpoint in `public/api/counter.php`
- Supply chain / dependency risks (malicious packages)

Out of scope:
- Browser / runtime vulnerabilities
- Self-hosting misconfiguration of PHP (beyond defaults in repo)

## Handling Sensitive Data

NoFace is designed so images never leave the user's device. If you find a path where data could leak off-device without explicit user action, treat it as HIGH severity.

## Secure Development Guidelines

- Keep dependencies updated (enable Dependabot / Renovate)
- Avoid introducing analytics scripts or remote calls
- Validate all future endpoints for path traversal or injection

Thank you for helping keep users safe and private.
