# Environment Variables and Secrets Handling

## Purpose

Define how production secrets and environment-specific values are injected without committing secrets to source control.

## Secret policy

Never commit real values for:

- `EmailTransport__SmtpPassword`
- `PushNotifications__VapidPrivateKey`
- `PushNotifications__VapidPublicKey` (public but still environment-controlled)
- `PushNotifications__VapidSubject`

Do not store these in:

- `appsettings.json`
- `appsettings.Production.json`
- test fixtures
- scripts that may be committed

## Recommended runtime injection keys

Use double-underscore environment mapping for ASP.NET Core:

- `ASPNETCORE_ENVIRONMENT=Production`
- `Auth__Otp__OtpLength`
- `Auth__Otp__OtpExpiryMinutes`
- `Auth__Otp__MaxVerificationAttempts`
- `Auth__Otp__ResendCooldownSeconds`
- `Auth__Otp__MaxCodesPerHourPerEmail`
- `Auth__Otp__SessionDurationHours`
- `Auth__Otp__SessionCookieName`
- `AdminAccess__BootstrapAdminEmails__0`
- `SeedAccess__Enabled=false`
- `EmailTransport__Mode=smtp`
- `EmailTransport__FromName`
- `EmailTransport__FromAddress`
- `EmailTransport__SmtpHost`
- `EmailTransport__SmtpPort`
- `EmailTransport__SmtpUseSsl=true`
- `EmailTransport__SmtpUsername`
- `EmailTransport__SmtpPassword`
- `PushNotifications__Mode=webpush` or `log`
- `PushNotifications__VapidSubject`
- `PushNotifications__VapidPublicKey`
- `PushNotifications__VapidPrivateKey`
- `PushNotifications__ReadingReminderDeepLinkPath`
- `Security__AllowedOrigins__0=https://portal.example.com`

## Local development vs production

- Development may use `SeedAccess:Enabled=true` in `appsettings.Development.json`.
- Production must set `SeedAccess:Enabled=false`.
- Development may run push mode `log`; production can run `log` or `webpush` depending on readiness.
- Production SMTP password and VAPID private key must come from secure environment or secret store.

## Runtime SMTP overrides in DB

- Admin runtime SMTP settings are stored in `Database/Collections/SystemSettings/email-transport.json`.
- SMTP password is stored encrypted at rest in `smtpPasswordCiphertext`.
- Plaintext SMTP password must never be written to JSON collections.
- Runtime mode supports:
  - `smtp` to send real emails
  - `log` to log email payloads only
  - `off` to suppress sending
- If DB runtime settings do not exist, the app falls back to `EmailTransport` values from configuration.
- Production security baseline remains OTP-first. Password-only login fallback is non-production only.

## Verification steps

1. Confirm no secret values are present in committed JSON files.
2. Confirm runtime environment includes required secret variables.
3. Start application and verify option validation passes on startup.
4. Verify `/health/ready` returns healthy with production configuration.
