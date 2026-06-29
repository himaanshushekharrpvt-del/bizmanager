package com.bizmanager.alert;

import com.bizmanager.common.AlertType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final AlertNotifier notifier;

    /** No-op if an unresolved alert for this exact (type, referenceKey) already exists - avoids spamming on every sale. */
    @Transactional
    public void raiseIfNotAlreadyActive(Long businessId, AlertType type, String referenceKey, String message) {
        boolean alreadyActive = alertRepository
                .findByBusinessIdAndTypeAndReferenceKeyAndResolvedFalse(businessId, type, referenceKey)
                .isPresent();
        if (alreadyActive) return;

        alertRepository.save(Alert.builder()
                .businessId(businessId)
                .type(type)
                .message(message)
                .referenceKey(referenceKey)
                .resolved(false)
                .build());

        notifier.notifyBusinessAdmins(businessId, type.name(), message);
    }

    @Transactional
    public void resolve(Long businessId, AlertType type, String referenceKey) {
        alertRepository.findByBusinessIdAndTypeAndReferenceKeyAndResolvedFalse(businessId, type, referenceKey)
                .ifPresent(alert -> {
                    alert.setResolved(true);
                    alert.setResolvedAt(LocalDateTime.now());
                    alertRepository.save(alert);
                });
    }

    public List<Alert> listActive(Long businessId) {
        return alertRepository.findByBusinessIdAndResolvedFalseOrderByCreatedAtDesc(businessId);
    }

    public List<Alert> listAll(Long businessId) {
        return alertRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
    }
}
