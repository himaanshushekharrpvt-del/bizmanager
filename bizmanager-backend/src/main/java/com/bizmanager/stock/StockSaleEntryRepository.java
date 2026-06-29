package com.bizmanager.stock;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StockSaleEntryRepository extends JpaRepository<StockSaleEntry, Long> {

    Optional<StockSaleEntry> findByBusinessIdAndStockItemIdAndSaleDate(Long businessId, Long stockItemId, LocalDate saleDate);

    List<StockSaleEntry> findByBusinessIdAndSaleDateBetweenOrderBySaleDateAsc(Long businessId, LocalDate from, LocalDate to);

    List<StockSaleEntry> findByBusinessIdAndSaleDate(Long businessId, LocalDate saleDate);

    @Query("select coalesce(sum(s.revenueGenerated), 0) from StockSaleEntry s " +
           "where s.businessId = :businessId and s.saleDate between :from and :to")
    BigDecimal sumRevenueInRange(Long businessId, LocalDate from, LocalDate to);

    @Query("select coalesce(sum(s.profitGenerated), 0) from StockSaleEntry s " +
           "where s.businessId = :businessId and s.saleDate between :from and :to")
    BigDecimal sumProfitInRange(Long businessId, LocalDate from, LocalDate to);

    @Query("select s.stockItem.id as itemId, s.stockItem.name as itemName, " +
           "sum(s.quantitySold) as totalQty, sum(s.revenueGenerated) as totalRevenue " +
           "from StockSaleEntry s where s.businessId = :businessId and s.saleDate between :from and :to " +
           "group by s.stockItem.id, s.stockItem.name order by sum(s.quantitySold) desc")
    List<ItemSalesAggregate> findBestSellersByQuantity(Long businessId, LocalDate from, LocalDate to);

    interface ItemSalesAggregate {
        Long getItemId();
        String getItemName();
        Long getTotalQty();
        BigDecimal getTotalRevenue();
    }
}
