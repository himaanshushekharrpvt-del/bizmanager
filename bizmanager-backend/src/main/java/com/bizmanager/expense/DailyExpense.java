package com.bizmanager.expense;

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
@Table(name = "daily_expenses", uniqueConstraints = @UniqueConstraint(columnNames = {"businessId", "expense_item_id", "expenseDate"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DailyExpense extends TenantEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "expense_item_id", nullable = false)
    private ExpenseItem expenseItem;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false)
    private BigDecimal amount;
}
