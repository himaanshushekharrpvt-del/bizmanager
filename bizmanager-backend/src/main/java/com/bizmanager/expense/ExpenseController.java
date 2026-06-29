package com.bizmanager.expense;

import com.bizmanager.security.AuthContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static com.bizmanager.expense.ExpenseDtos.*;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuthContext authContext;

    @GetMapping("/items")
    public List<ExpenseItemResponse> listItems(@RequestParam(defaultValue = "true") boolean activeOnly) {
        Long businessId = authContext.businessId();
        var items = activeOnly ? expenseService.listActiveItems(businessId) : expenseService.listAllItems(businessId);
        return items.stream().map(ExpenseItemResponse::from).toList();
    }

    @PostMapping("/items")
    public ExpenseItemResponse createItem(@Valid @RequestBody CreateExpenseItemRequest req) {
        return ExpenseItemResponse.from(expenseService.createItem(req.name()));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deactivateItem(@PathVariable Long itemId) {
        expenseService.deactivateItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public DailyExpenseResponse logExpense(@Valid @RequestBody LogDailyExpenseRequest req) {
        return DailyExpenseResponse.from(expenseService.logExpense(req));
    }

    @GetMapping
    public List<DailyExpenseResponse> listExpenses(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return expenseService.listInRange(authContext.businessId(), from, to).stream()
                .map(DailyExpenseResponse::from).toList();
    }
}
