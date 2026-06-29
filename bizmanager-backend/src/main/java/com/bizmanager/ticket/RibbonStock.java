package com.bizmanager.ticket;

import com.bizmanager.common.TenantEntity;
import com.bizmanager.common.TicketCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ribbon_stock", uniqueConstraints = @UniqueConstraint(columnNames = {"businessId", "category"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RibbonStock extends TenantEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketCategory category;

    @Column(nullable = false)
    private int quantityAvailable;

    @Builder.Default
    private int lowStockThreshold = 200;
}
