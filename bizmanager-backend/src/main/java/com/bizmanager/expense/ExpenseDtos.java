package com.bizmanager.expense;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseDtos {

    public record CreateExpenseItemRequest(@NotBlank String name) {}

    public record ExpenseItemResponse(Long id, String name, boolean active) {
        public static ExpenseItemResponse from(ExpenseItem item) {
            return new ExpenseItemResponse(item.getId(), item.getName(), item.isActive());
        }
    }

    public record LogDailyExpenseRequest(
            @NotNull Long expenseItemId,
            @NotNull LocalDate expenseDate,
            @NotNull @Min(0) BigDecimal amount
    ) {}

    public record DailyExpenseResponse(
            Long id, Long expenseItemId, String expenseItemName, LocalDate expenseDate, BigDecimal amount
    ) {
        public static DailyExpenseResponse from(DailyExpense e) {
            return new DailyExpenseResponse(e.getId(), e.getExpenseItem().getId(), e.getExpenseItem().getName(),
                    e.getExpenseDate(), e.getAmount());
        }
    }
}
