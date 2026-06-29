package com.bizmanager.ticket;

import com.bizmanager.common.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RibbonStockRepository extends JpaRepository<RibbonStock, Long> {
    List<RibbonStock> findByBusinessId(Long businessId);

    Optional<RibbonStock> findByBusinessIdAndCategory(Long businessId, TicketCategory category);
}
