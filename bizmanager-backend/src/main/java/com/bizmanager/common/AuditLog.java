package com.bizmanager.common;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "audit_logs", indexes = {
        @jakarta.persistence.Index(name = "idx_audit_business_time", columnList = "businessId,createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog extends BaseEntity {

    @Column(nullable = false)
    private Long businessId;

    @Column(nullable = false)
    private Long actorUserId;

    @Column(nullable = false)
    private String actorName; // snapshot, in case the user is later removed

    @Column(nullable = false)
    private String action; // e.g. "TICKET_PRICE_UPDATED", "RIBBON_RESTOCKED", "ROLE_CREATED"

    @Column(nullable = false)
    private String entityType; // e.g. "TicketPricing"

    private String entityId;

    @Lob
    private String oldValue;

    @Lob
    private String newValue;

    private String notes;
}
