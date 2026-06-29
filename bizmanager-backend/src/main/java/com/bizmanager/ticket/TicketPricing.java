package com.bizmanager.ticket;

import com.bizmanager.common.DayType;
import com.bizmanager.common.TenantEntity;
import com.bizmanager.common.TicketCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "ticket_pricing")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TicketPricing extends TenantEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayType dayType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketCategory category;

    @Column(nullable = false)
    private BigDecimal price;

    /** Only one active row per (businessId, dayType, category) at a time - older ones are kept, just deactivated, for history. */
    @Builder.Default
    private boolean active = true;
}
