package com.bizmanager.ticket;

import com.bizmanager.common.DayType;
import com.bizmanager.common.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TicketPricingRepository extends JpaRepository<TicketPricing, Long> {
    List<TicketPricing> findByBusinessIdAndActiveTrue(Long businessId);

    Optional<TicketPricing> findByBusinessIdAndDayTypeAndCategoryAndActiveTrue(
            Long businessId, DayType dayType, TicketCategory category);

    List<TicketPricing> findByBusinessIdOrderByCreatedAtDesc(Long businessId);
}
