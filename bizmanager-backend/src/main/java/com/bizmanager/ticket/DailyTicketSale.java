package com.bizmanager.ticket;

import com.bizmanager.common.DayType;
import com.bizmanager.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "daily_ticket_sales", uniqueConstraints = @UniqueConstraint(columnNames = {"businessId", "saleDate"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DailyTicketSale extends TenantEntity {

    @Column(nullable = false)
    private LocalDate saleDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayType dayType;

    @Column(nullable = false)
    private int adultSold;

    @Column(nullable = false)
    private int childSold;

    @Column(nullable = false)
    private BigDecimal adultPriceUsed;

    @Column(nullable = false)
    private BigDecimal childPriceUsed;

    @Column(nullable = false)
    private BigDecimal adultRevenue;

    @Column(nullable = false)
    private BigDecimal childRevenue;

    @Column(nullable = false)
    private BigDecimal totalRevenue;
}
