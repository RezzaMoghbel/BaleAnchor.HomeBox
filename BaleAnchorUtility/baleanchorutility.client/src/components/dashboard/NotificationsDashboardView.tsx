import type { ReactNode } from "react";
import type {
  NotificationPreferencesResponse,
  PushPublicConfigResponse,
  PushSubscriptionResponse,
  ReminderJobItemResponse,
} from "../../shared/contracts";

interface NotificationsDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  notificationMessage: string;
  pushConfig: PushPublicConfigResponse | null;
  preferences: NotificationPreferencesResponse | null;
  subscriptions: PushSubscriptionResponse[];
  reminderJobs: ReminderJobItemResponse[];
  onLoadPreferences: () => Promise<void>;
  onSavePreferences: () => Promise<void>;
  onLoadSubscriptions: () => Promise<void>;
  onLoadReminderJobs: () => Promise<void>;
  onSubscribePush: () => Promise<void>;
  onUnsubscribePush: (subscriptionId: string) => Promise<void>;
  onSendTestNotification: () => Promise<void>;
  onTimeZoneIdChange: (value: string) => void;
  onEmailRemindersEnabledChange: (value: boolean) => void;
  onPushRemindersEnabledChange: (value: boolean) => void;
  onReadingReminderEnabledChange: (value: boolean) => void;
  formatDisplayDateTime: (value?: string) => string;
}

export function NotificationsDashboardView({
  shellHeader,
  routeTabs,
  loading,
  notificationMessage,
  pushConfig,
  preferences,
  subscriptions,
  reminderJobs,
  onLoadPreferences,
  onSavePreferences,
  onLoadSubscriptions,
  onLoadReminderJobs,
  onSubscribePush,
  onUnsubscribePush,
  onSendTestNotification,
  onTimeZoneIdChange,
  onEmailRemindersEnabledChange,
  onPushRemindersEnabledChange,
  onReadingReminderEnabledChange,
  formatDisplayDateTime,
}: NotificationsDashboardViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}

      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Reminders and Notifications</h1>
              <p className="hero-copy mb-0">
                Manage reminder schedule preferences, push subscriptions, and
                delivery checks for your reading workflow.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Status</h5>
              <div className="alert alert-light border mb-0" role="status">
                {notificationMessage}
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-3">Reminder preferences</h5>

                  {!preferences ? (
                    <p className="text-secondary mb-0">
                      Load preferences to configure reminder channels.
                    </p>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      <label className="form-label mb-0">
                        Time zone
                        <input
                          className="form-control mt-1"
                          value={preferences.timeZoneId}
                          onChange={(event) =>
                            onTimeZoneIdChange(event.target.value)
                          }
                          disabled={loading}
                        />
                      </label>

                      <label className="form-check mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={preferences.readingReminderEnabled}
                          onChange={(event) =>
                            onReadingReminderEnabledChange(event.target.checked)
                          }
                          disabled={loading}
                        />
                        <span className="form-check-label">
                          Enable reading reminders
                        </span>
                      </label>

                      <label className="form-check mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={preferences.emailRemindersEnabled}
                          onChange={(event) =>
                            onEmailRemindersEnabledChange(event.target.checked)
                          }
                          disabled={loading}
                        />
                        <span className="form-check-label">
                          Send reminder emails
                        </span>
                      </label>

                      <label className="form-check mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={preferences.pushRemindersEnabled}
                          onChange={(event) =>
                            onPushRemindersEnabledChange(event.target.checked)
                          }
                          disabled={loading}
                        />
                        <span className="form-check-label">
                          Send push reminders
                        </span>
                      </label>

                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => void onLoadPreferences()}
                          disabled={loading}
                        >
                          Reload preferences
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void onSavePreferences()}
                          disabled={loading}
                        >
                          Save preferences
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-6">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-3">Push subscriptions</h5>
                  <div className="small text-secondary mb-3">
                    Push enabled: {pushConfig?.pushEnabled ? "Yes" : "No"}
                    <br />
                    Deep link path: {pushConfig?.deepLinkPath ?? "N/A"}
                  </div>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => void onLoadSubscriptions()}
                      disabled={loading}
                    >
                      Reload subscriptions
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onSubscribePush()}
                      disabled={loading}
                    >
                      Subscribe this device
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => void onSendTestNotification()}
                      disabled={loading}
                    >
                      Send test notification
                    </button>
                  </div>

                  {subscriptions.length === 0 ? (
                    <p className="text-secondary mb-0">
                      No active subscriptions saved.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th scope="col">Endpoint</th>
                            <th scope="col">Updated</th>
                            <th scope="col" className="text-end">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscriptions.map((item) => (
                            <tr key={item.subscriptionId}>
                              <td className="small text-break">
                                {item.endpoint}
                              </td>
                              <td className="small">
                                {formatDisplayDateTime(item.updatedAtUtc)}
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    void onUnsubscribePush(item.subscriptionId)
                                  }
                                  disabled={loading}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Scheduled reminder jobs</h5>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadReminderJobs()}
                  disabled={loading}
                >
                  Reload jobs
                </button>
              </div>

              {reminderJobs.length === 0 ? (
                <p className="text-secondary mb-0">
                  No reminder jobs available.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th scope="col">Kind</th>
                        <th scope="col">Channel</th>
                        <th scope="col">Recommended date</th>
                        <th scope="col">Scheduled UTC</th>
                        <th scope="col">Status</th>
                        <th scope="col">Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reminderJobs.map((job: ReminderJobItemResponse) => (
                        <tr key={job.jobId}>
                          <td>{job.kind}</td>
                          <td>{job.channel}</td>
                          <td>{job.recommendedReadingDate}</td>
                          <td>{formatDisplayDateTime(job.scheduledForUtc)}</td>
                          <td>{job.status}</td>
                          <td>
                            {job.attemptCount}/{job.maxAttempts}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
