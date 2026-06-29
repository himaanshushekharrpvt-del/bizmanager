package com.bizmanager.stock;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockItemRepository extends JpaRepository<StockItem, Long> {
    List<StockItem> findByBusinessIdAndActiveTrue(Long businessId);

    List<StockItem> findByBusinessId(Long businessId);

    Optional<StockItem> findByIdAndBusinessId(Long id, Long businessId);

    boolean existsByBusinessIdAndNameIgnoreCase(Long businessId, String name);
}
