package com.bizmanager.stock;

import com.bizmanager.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "stock_sale_entries", uniqueConstraints = @UniqueConstraint(columnNames = {"businessId", "stock_item_id", "saleDate"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class StockSaleEntry extends TenantEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "stock_item_id", nullable = false)
    private StockItem stockItem;

    @Column(nullable = false)
    private LocalDate saleDate;

    @Column(nullable = false)
    private int quantitySold;

    @Column(nullable = false)
    private BigDecimal revenueGenerated;

    @Column(nullable = false)
    private BigDecimal profitGenerated;

    @Column(nullable = false)
    private Long enteredByUserId;

    @Column(nullable = false)
    private String enteredByName;
}
