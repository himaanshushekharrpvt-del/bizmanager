package com.bizmanager.alert;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LoggingAlertNotifier implements AlertNotifier {
    @Override
    public void notifyBusinessAdmins(Long businessId, String subject, String message) {
        log.warn("[ALERT][business={}] {} - {}", businessId, subject, message);
    }
}
