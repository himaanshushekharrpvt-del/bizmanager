package com.bizmanager.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyTicketSaleRepository extends JpaRepository<DailyTicketSale, Long> {
    Optional<DailyTicketSale> findByBusinessIdAndSaleDate(Long businessId, LocalDate saleDate);

    List<DailyTicketSale> findByBusinessIdAndSaleDateBetweenOrderBySaleDateAsc(
            Long businessId, LocalDate from, LocalDate to);

    @Query("select coalesce(sum(s.totalRevenue), 0) from DailyTicketSale s " +
           "where s.businessId = :businessId and s.saleDate between :from and :to")
    BigDecimal sumRevenueInRange(Long businessId, LocalDate from, LocalDate to);

    @Query("select coalesce(sum(s.adultSold), 0) from DailyTicketSale s " +
           "where s.businessId = :businessId and s.saleDate between :from and :to")
    Long sumAdultSoldInRange(Long businessId, LocalDate from, LocalDate to);

    @Query("select coalesce(sum(s.childSold), 0) from DailyTicketSale s " +
           "where s.businessId = :businessId and s.saleDate between :from and :to")
    Long sumChildSoldInRange(Long businessId, LocalDate from, LocalDate to);
}
