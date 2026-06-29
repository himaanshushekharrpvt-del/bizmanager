package com.bizmanager.expense;

import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.Permission;
import com.bizmanager.common.ResourceNotFoundException;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static com.bizmanager.expense.ExpenseDtos.*;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseItemRepository expenseItemRepository;
    private final DailyExpenseRepository dailyExpenseRepository;
    private final AuditService auditService;
    private final AuthContext authContext;

    @Transactional
    public ExpenseItem createItem(String name) {
        authContext.require(Permission.MANAGE_EXPENSE_ITEMS);
        Long businessId = authContext.businessId();
        if (expenseItemRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BadRequestException("An expense item named '" + name + "' already exists");
        }
        ExpenseItem item = expenseItemRepository.save(ExpenseItem.builder().businessId(businessId).name(name).active(true).build());
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "EXPENSE_ITEM_CREATED", "ExpenseItem", item.getId(), null, name, null);
        return item;
    }

    @Transactional
    public void deactivateItem(Long itemId) {
        authContext.require(Permission.MANAGE_EXPENSE_ITEMS);
        Long businessId = authContext.businessId();
        ExpenseItem item = getOwnedItem(itemId, businessId);
        item.setActive(false);
        expenseItemRepository.save(item);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "EXPENSE_ITEM_DEACTIVATED", "ExpenseItem", itemId, true, false, null);
    }

    public List<ExpenseItem> listActiveItems(Long businessId) {
        return expenseItemRepository.findByBusinessIdAndActiveTrue(businessId);
    }

    public List<ExpenseItem> listAllItems(Long businessId) {
        return expenseItemRepository.findByBusinessId(businessId);
    }

    /** Upsert by (item, date) - re-logging the same day/item is a correction, not a duplicate. */
    @Transactional
    public DailyExpense logExpense(LogDailyExpenseRequest req) {
        authContext.require(Permission.ENTER_DAILY_EXPENSE);
        Long businessId = authContext.businessId();
        ExpenseItem item = getOwnedItem(req.expenseItemId(), businessId);

        var existing = dailyExpenseRepository.findByBusinessIdAndExpenseItemIdAndExpenseDate(
                businessId, req.expenseItemId(), req.expenseDate());

        DailyExpense saved;
        if (existing.isPresent()) {
            DailyExpense e = existing.get();
            BigDecimal old = e.getAmount();
            e.setAmount(req.amount());
            saved = dailyExpenseRepository.save(e);
            auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                    "EXPENSE_CORRECTED", "DailyExpense", saved.getId(), old, req.amount(),
                    item.getName() + " / " + req.expenseDate());
        } else {
            saved = dailyExpenseRepository.save(DailyExpense.builder()
                    .businessId(businessId).expenseItem(item).expenseDate(req.expenseDate()).amount(req.amount())
                    .build());
            auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                    "EXPENSE_LOGGED", "DailyExpense", saved.getId(), null, req.amount(),
                    item.getName() + " / " + req.expenseDate());
        }
        return saved;
    }

    public List<DailyExpense> listInRange(Long businessId, LocalDate from, LocalDate to) {
        return dailyExpenseRepository.findByBusinessIdAndExpenseDateBetweenOrderByExpenseDateAsc(businessId, from, to);
    }

    public BigDecimal totalInRange(Long businessId, LocalDate from, LocalDate to) {
        return dailyExpenseRepository.sumInRange(businessId, from, to);
    }

    public List<DailyExpenseRepository.ExpenseBreakdownRow> breakdownInRange(Long businessId, LocalDate from, LocalDate to) {
        return dailyExpenseRepository.findBreakdownInRange(businessId, from, to);
    }

    private ExpenseItem getOwnedItem(Long itemId, Long businessId) {
        return expenseItemRepository.findByIdAndBusinessId(itemId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense item not found"));
    }
}
