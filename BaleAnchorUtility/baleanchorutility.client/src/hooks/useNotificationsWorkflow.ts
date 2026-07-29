import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { portalClient, PortalApiError } from "../api/portalClient";
import type {
  NotificationPreferencesResponse,
  PushPublicConfigResponse,
  PushSubscriptionResponse,
  ReminderJobItemResponse,
} from "../shared/contracts";

interface UseNotificationsWorkflowArgs {
  isNotificationsDashboard: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export function useNotificationsWorkflow({
  isNotificationsDashboard,
  setLoading,
}: UseNotificationsWorkflowArgs) {
  const [notificationMessage, setNotificationMessage] = useState(
    "No notification action run yet.",
  );

  const [pushConfig, setPushConfig] = useState<PushPublicConfigResponse | null>(
    null,
  );
  const [preferences, setPreferences] =
    useState<NotificationPreferencesResponse | null>(null);
  const [subscriptions, setSubscriptions] = useState<
    PushSubscriptionResponse[]
  >([]);
  const [reminderJobs, setReminderJobs] = useState<ReminderJobItemResponse[]>(
    [],
  );

  const loadPushConfig = async () => {
    try {
      const response = await portalClient.getPushPublicConfig();
      setPushConfig(response);
    } catch {
      setPushConfig(null);
    }
  };

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getReminderPreferences();
      setPreferences(body);
      setNotificationMessage("Loaded reminder preferences.");
    } catch (error) {
      if (error instanceof PortalApiError) {
        setNotificationMessage(
          `Unable to load reminder preferences. ${error.message}`,
        );
      } else {
        setNotificationMessage("Unable to load reminder preferences.");
      }
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) {
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.updateReminderPreferences({
        emailRemindersEnabled: preferences.emailRemindersEnabled,
        pushRemindersEnabled: preferences.pushRemindersEnabled,
        readingReminderEnabled: preferences.readingReminderEnabled,
        timeZoneId: preferences.timeZoneId,
      });
      setPreferences(body);
      setNotificationMessage("Reminder preferences saved.");
    } catch (error) {
      if (error instanceof PortalApiError) {
        setNotificationMessage(`Unable to save preferences. ${error.message}`);
      } else {
        setNotificationMessage("Unable to save preferences.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getPushSubscriptions();
      setSubscriptions(body.items);
      if (!silent) {
        setNotificationMessage(`Loaded ${body.count} push subscription(s).`);
      }
    } catch (error) {
      setSubscriptions([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setNotificationMessage(
            `Unable to load push subscriptions. ${error.message}`,
          );
        } else {
          setNotificationMessage("Unable to load push subscriptions.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadReminderJobs = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getReminderJobs();
      setReminderJobs(body.items);
      if (!silent) {
        setNotificationMessage(`Loaded ${body.count} reminder job(s).`);
      }
    } catch (error) {
      setReminderJobs([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setNotificationMessage(
            `Unable to load reminder jobs. ${error.message}`,
          );
        } else {
          setNotificationMessage("Unable to load reminder jobs.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const subscribePush = async () => {
    if (!pushConfig?.pushEnabled || !pushConfig.vapidPublicKey) {
      setNotificationMessage("Push is not enabled by server configuration.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotificationMessage(
        "This browser does not support push notifications.",
      );
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationMessage("Push permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const browserSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(
          pushConfig.vapidPublicKey,
        ) as BufferSource,
      });

      const json = browserSubscription.toJSON();
      const keys = json.keys;
      if (!json.endpoint || !keys?.p256dh || !keys.auth) {
        setNotificationMessage("Push subscription payload was incomplete.");
        return;
      }

      await portalClient.upsertPushSubscription({
        endpoint: json.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        clientUserAgent: navigator.userAgent,
      });

      setNotificationMessage("Push subscription saved.");
      await loadSubscriptions(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setNotificationMessage(`Unable to subscribe to push. ${error.message}`);
      } else {
        setNotificationMessage("Unable to subscribe to push notifications.");
      }
    } finally {
      setLoading(false);
    }
  };

  const unsubscribePush = async (subscriptionId: string) => {
    setLoading(true);
    try {
      await portalClient.deletePushSubscription(subscriptionId);
      setNotificationMessage("Push subscription removed.");
      await loadSubscriptions(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setNotificationMessage(
          `Unable to remove push subscription. ${error.message}`,
        );
      } else {
        setNotificationMessage("Unable to remove push subscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const response = await portalClient.sendPushTestNotification();
      setNotificationMessage(response.message);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setNotificationMessage(
          `Unable to send test notification. ${error.message}`,
        );
      } else {
        setNotificationMessage("Unable to send test notification.");
      }
    } finally {
      setLoading(false);
    }
  };

  const setTimeZoneId = (timeZoneId: string) => {
    setPreferences((current) =>
      current
        ? {
            ...current,
            timeZoneId,
          }
        : current,
    );
  };

  const setEmailRemindersEnabled = (enabled: boolean) => {
    setPreferences((current) =>
      current
        ? {
            ...current,
            emailRemindersEnabled: enabled,
          }
        : current,
    );
  };

  const setPushRemindersEnabled = (enabled: boolean) => {
    setPreferences((current) =>
      current
        ? {
            ...current,
            pushRemindersEnabled: enabled,
          }
        : current,
    );
  };

  const setReadingReminderEnabled = (enabled: boolean) => {
    setPreferences((current) =>
      current
        ? {
            ...current,
            readingReminderEnabled: enabled,
          }
        : current,
    );
  };

  useEffect(() => {
    if (!isNotificationsDashboard) {
      return;
    }

    void loadPushConfig();
    void loadPreferences();
    void loadSubscriptions(true);
    void loadReminderJobs(true);
  }, [isNotificationsDashboard]);

  return {
    notificationMessage,
    pushConfig,
    preferences,
    subscriptions,
    reminderJobs,
    loadPushConfig,
    loadPreferences,
    savePreferences,
    loadSubscriptions,
    loadReminderJobs,
    subscribePush,
    unsubscribePush,
    sendTestNotification,
    setTimeZoneId,
    setEmailRemindersEnabled,
    setPushRemindersEnabled,
    setReadingReminderEnabled,
  };
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
