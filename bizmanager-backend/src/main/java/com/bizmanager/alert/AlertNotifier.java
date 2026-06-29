package com.bizmanager.alert;

/**
 * Where an alert actually gets delivered (email/SMS/push) is intentionally
 * not implemented here - swap in a real provider (SendGrid, Twilio, FCM,
 * etc.) by implementing this and removing LoggingAlertNotifier. Every alert
 * is also always persisted via AlertService regardless of whether delivery
 * succeeds, so nothing is lost even before you wire this up.
 */
public interface AlertNotifier {
    void notifyBusinessAdmins(Long businessId, String subject, String message);
}
