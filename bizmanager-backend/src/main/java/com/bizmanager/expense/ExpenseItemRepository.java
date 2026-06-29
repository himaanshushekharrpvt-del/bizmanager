package com.bizmanager.expense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExpenseItemRepository extends JpaRepository<ExpenseItem, Long> {
    List<ExpenseItem> findByBusinessIdAndActiveTrue(Long businessId);

    List<ExpenseItem> findByBusinessId(Long businessId);

    Optional<ExpenseItem> findByIdAndBusinessId(Long id, Long businessId);

    boolean existsByBusinessIdAndNameIgnoreCase(Long businessId, String name);
}
