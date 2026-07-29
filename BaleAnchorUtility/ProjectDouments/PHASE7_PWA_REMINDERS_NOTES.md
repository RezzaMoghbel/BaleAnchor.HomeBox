# Phase 7 PWA, Reminders, and Push Notes

## Scope delivered

This phase introduces reminder scheduling, push subscriptions, and PWA notification plumbing as a full vertical slice.

## Backend additions

Implemented end-to-end reminder architecture:

- Domain models:
  - NotificationPreferences
  - PushSubscription
  - ReminderDispatchJob with attempt history
- Repository contracts and JSON implementations for all reminder and push records
- NotificationPreferencesService for resident notification channel and timezone preferences
- PushNotificationService for config exposure, subscription lifecycle, and test notification dispatch
- ReminderDispatchService for:
  - scheduling reminders at 7 days, 2 days, and day-of
  - idempotent dedupe key generation
  - cancellation of future jobs after reading submission
  - retries with backoff and dead-letter status
  - per-attempt history recording
- ReminderDispatchHostedService background worker running periodic due-job dispatch

### API endpoints added

- GET /api/v1/reminders/preferences
- PUT /api/v1/reminders/preferences
- GET /api/v1/reminders/jobs
- GET /api/v1/push/config
- GET /api/v1/push/subscriptions
- POST /api/v1/push/subscriptions
- DELETE /api/v1/push/subscriptions/{subscriptionId}
- POST /api/v1/push/test

## Email and push channels

- IEmailSender now supports reading reminder sends in addition to OTP.
- SMTP and logging senders both implement the reminder method.
- Web push abstraction is implemented through ConfiguredWebPushSender.
- Push mode is configuration-driven:
  - log mode for development
  - webpush mode with VAPID values from configuration/secret sources

## Scheduling rules implemented

For each next recommended reading date, jobs are created for:

- 7 days before
- 2 days before
- day-of

Per-channel jobs are generated based on resident preferences.

## Frontend and PWA additions

- PWA files added:
  - public/manifest.webmanifest
  - public/sw.js
- Service worker registration added in main.tsx
- Notification management UI added as a dedicated dashboard section
- Push subscribe/unsubscribe/test flow integrated with API
- Notification click deep-links to /dashboard/readings
- Reminder job list and preference controls exposed to resident dashboard

## Validation and test status

- Backend tests updated and expanded for preferences, reminder scheduling, dispatch behavior, and new controller paths
- Client tests remain passing after integration
- Client production build succeeds with PWA assets included

## Hardening pass completed

- Added audit logging for resident reminder preference mutations.
- Added audit logging for push subscription create, update, and delete operations.
- Expanded dispatch failure-path tests to assert retry backoff behavior and dead-letter terminal behavior.
- Added dedicated push service tests to assert audit trail creation on subscription lifecycle changes.

## Operational notes

- Keep PushNotifications:Mode=log in environments without configured VAPID credentials.
- When switching to webpush mode, set VAPID values via secret-managed configuration, not source-controlled files.
- Existing OpenAPI and react-router vulnerability warnings remain pre-existing and should be tracked as follow-up remediation tasks.
