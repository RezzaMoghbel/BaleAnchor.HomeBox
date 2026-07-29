# Phase 5 Hardening Notes

## Added Cross-Cutting Runtime Controls

- Startup now validates critical option sections on boot:
  - Auth OTP options
  - Admin access options
  - Seed access options
  - Email transport options
- Request pipeline now includes:
  - structured request logging middleware
  - fixed-window IP-based rate limiting with tighter limits on OTP routes
  - CSRF origin/referrer validation for state-changing requests carrying session cookies
  - health check endpoints:
    - /health/live
    - /health/ready

## JSON Persistence Resilience

- JSON collection operations now include:
  - temp-file cleanup on read/write startup paths
  - corrupted JSON document quarantine to \_quarantine folder
  - startup index rebuild pass across all collections
  - in-memory per-collection index cache refresh during reads and writes
- Existing atomic replace behavior and backup-based replacement remain in place.

## Operational Caveats

- Current global rate-limit partitioning is IP-based and intentionally simple; a future phase should add user/session-aware partitions.
- CSRF origin controls rely on request host and optional Security:AllowedOrigins list; deployments behind proxies should ensure forwarded headers and trusted host configuration are aligned.
- Build warnings currently include known third-party vulnerabilities (Microsoft.OpenApi and react-router packages) that should be resolved in a dependency remediation pass.
