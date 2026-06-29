package com.bizmanager.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void record(Long businessId, Long actorUserId, String actorName, String action,
                        String entityType, Object entityId, Object oldValue, Object newValue, String notes) {
        auditLogRepository.save(AuditLog.builder()
                .businessId(businessId)
                .actorUserId(actorUserId)
                .actorName(actorName)
                .action(action)
                .entityType(entityType)
                .entityId(entityId == null ? null : String.valueOf(entityId))
                .oldValue(toJson(oldValue))
                .newValue(toJson(newValue))
                .notes(notes)
                .build());
    }

    public Page<AuditLog> findForBusiness(Long businessId, Pageable pageable) {
        return auditLogRepository.findByBusinessIdOrderByCreatedAtDesc(businessId, pageable);
    }

    public Page<AuditLog> findForBusinessInRange(Long businessId, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return auditLogRepository.findByBusinessIdAndCreatedAtBetweenOrderByCreatedAtDesc(businessId, from, to, pageable);
    }

    public Page<AuditLog> findForEntityType(Long businessId, String entityType, Pageable pageable) {
        return auditLogRepository.findByBusinessIdAndEntityTypeOrderByCreatedAtDesc(businessId, entityType, pageable);
    }

    private String toJson(Object value) {
        if (value == null) return null;
        try {
            return value instanceof String ? (String) value : objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }
}
