package com.bizmanager.common;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByBusinessIdOrderByCreatedAtDesc(Long businessId, Pageable pageable);

    Page<AuditLog> findByBusinessIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long businessId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<AuditLog> findByBusinessIdAndEntityTypeOrderByCreatedAtDesc(
            Long businessId, String entityType, Pageable pageable);
}
