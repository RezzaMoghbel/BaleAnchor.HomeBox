# Production Configuration Matrix

## Purpose

This matrix defines required production configuration keys, expected sources, validation rules, and whether values may be committed to source control.

## Server configuration matrix

| Key                                             | Purpose                              | Required in Production | Source                               | Validation / Notes                               | Commit to Source |
| ----------------------------------------------- | ------------------------------------ | ---------------------- | ------------------------------------ | ------------------------------------------------ | ---------------- |
| `Auth:Otp:OtpLength`                            | OTP code length                      | Yes                    | `appsettings.Production.json` or env | 4 to 8                                           | Yes              |
| `Auth:Otp:OtpExpiryMinutes`                     | OTP expiry                           | Yes                    | config file / env                    | 1 to 30                                          | Yes              |
| `Auth:Otp:MaxVerificationAttempts`              | brute-force protection               | Yes                    | config file / env                    | 1 to 10                                          | Yes              |
| `Auth:Otp:ResendCooldownSeconds`                | resend throttle                      | Yes                    | config file / env                    | 0 to 600                                         | Yes              |
| `Auth:Otp:MaxCodesPerHourPerEmail`              | request throttle                     | Yes                    | config file / env                    | 1 to 50                                          | Yes              |
| `Auth:Otp:SessionDurationHours`                 | cookie session duration              | Yes                    | config file / env                    | 1 to 336                                         | Yes              |
| `Auth:Otp:SessionCookieName`                    | auth cookie name                     | Yes                    | config file / env                    | non-empty                                        | Yes              |
| `AdminAccess:BootstrapAdminEmails`              | emergency admin bootstrap allow-list | Optional               | config file / env                    | must be valid emails                             | Yes              |
| `SeedAccess:Enabled`                            | dev-only seed mechanism toggle       | Yes                    | production config                    | must be `false`                                  | Yes              |
| `SeedAccess:FixedOtpCode`                       | dev fixed OTP                        | No                     | n/a in production                    | must be empty when disabled in prod files        | No               |
| `SeedAccess:Accounts`                           | dev seed accounts                    | No                     | n/a in production                    | must be empty when disabled in prod files        | No               |
| `EmailTransport:Mode`                           | outbound email transport mode        | Yes                    | config file / env                    | `smtp` for production                            | Yes              |
| `EmailTransport:FromName`                       | email sender display name            | Yes                    | config file / env                    | non-empty                                        | Yes              |
| `EmailTransport:FromAddress`                    | sender mailbox                       | Yes                    | config file / env                    | valid email address                              | Yes              |
| `EmailTransport:SmtpHost`                       | SMTP host                            | Yes (smtp mode)        | config file / env                    | non-empty                                        | Yes              |
| `EmailTransport:SmtpPort`                       | SMTP port                            | Yes (smtp mode)        | config file / env                    | 1 to 65535                                       | Yes              |
| `EmailTransport:SmtpUseSsl`                     | SMTP TLS switch                      | Yes                    | config file / env                    | bool                                             | Yes              |
| `EmailTransport:SmtpUsername`                   | SMTP username                        | Yes (smtp mode)        | config file / env                    | non-empty                                        | Yes              |
| `EmailTransport:SmtpPassword`                   | SMTP password secret                 | Yes (smtp mode)        | secret store / env                   | non-empty in runtime; must not be in appsettings | No               |
| `PushNotifications:Mode`                        | push dispatch mode                   | Yes                    | config file / env                    | `log` or `webpush`                               | Yes              |
| `PushNotifications:VapidSubject`                | VAPID subject                        | Yes (`webpush` mode)   | secret store / env                   | non-empty when webpush                           | No               |
| `PushNotifications:VapidPublicKey`              | VAPID public key                     | Yes (`webpush` mode)   | secret store / env                   | non-empty when webpush                           | No               |
| `PushNotifications:VapidPrivateKey`             | VAPID private key secret             | Yes (`webpush` mode)   | secret store / env                   | non-empty when webpush; never in source          | No               |
| `PushNotifications:ReadingReminderDeepLinkPath` | notification click route             | Yes                    | config file / env                    | must start with `/`                              | Yes              |
| `Security:AllowedOrigins`                       | CSRF trusted origins                 | Yes                    | config file / env                    | full origins (scheme + host + optional port)     | Yes              |
| `ASPNETCORE_ENVIRONMENT`                        | environment name                     | Yes                    | host env                             | `Production` in live                             | No               |

## Mandatory production invariants

- `SeedAccess:Enabled` must be `false`.
- `EmailTransport:SmtpPassword` must be injected at runtime and not stored in committed JSON.
- `PushNotifications:VapidPrivateKey` must be injected at runtime and not stored in committed JSON.
- Any `PushNotifications` setting that enables `webpush` must include complete VAPID values.
- `Security:AllowedOrigins` must include the deployed portal origin(s).
