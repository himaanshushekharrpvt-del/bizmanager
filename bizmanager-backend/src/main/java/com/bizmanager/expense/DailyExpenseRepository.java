package com.bizmanager.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyExpenseRepository extends JpaRepository<DailyExpense, Long> {
    Optional<DailyExpense> findByBusinessIdAndExpenseItemIdAndExpenseDate(
            Long businessId, Long expenseItemId, LocalDate expenseDate);

    List<DailyExpense> findByBusinessIdAndExpenseDateBetweenOrderByExpenseDateAsc(
            Long businessId, LocalDate from, LocalDate to);

    List<DailyExpense> findByBusinessIdAndExpenseDate(Long businessId, LocalDate expenseDate);

    @Query("select coalesce(sum(d.amount), 0) from DailyExpense d " +
            "where d.businessId = :businessId and d.expenseDate between :from and :to")
    BigDecimal sumInRange(Long businessId, LocalDate from, LocalDate to);

    @Query("select d.expenseItem.name as itemName, sum(d.amount) as total from DailyExpense d " +
            "where d.businessId = :businessId and d.expenseDate between :from and :to " +
            "group by d.expenseItem.name order by sum(d.amount) desc")
    List<ExpenseBreakdownRow> findBreakdownInRange(Long businessId, LocalDate from, LocalDate to);

    interface ExpenseBreakdownRow {
        String getItemName();
        BigDecimal getTotal();
    }
}
