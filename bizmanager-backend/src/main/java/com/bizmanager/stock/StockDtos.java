package com.bizmanager.stock;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class StockDtos {

    public record CreateStockItemRequest(
            @NotBlank String name,
            @Min(0) int quantity,
            @NotNull @Min(0) BigDecimal costPrice,
            @NotNull @Min(0) BigDecimal sellingPrice,
            Integer lowStockThreshold
    ) {}

    public record UpdateStockItemRequest(
            String name,
            Integer quantity,
            Integer restockQuantity,
            BigDecimal costPrice,
            BigDecimal sellingPrice,
            Integer lowStockThreshold
    ) {}

    public record LogStockSaleRequest(
            @NotNull Long stockItemId,
            @NotNull LocalDate saleDate,
            @Min(0) int quantitySold
    ) {}

    /** Full view - Admin/MasterAdmin only. */
    public record AdminStockItemResponse(
            Long id, String name, int quantity, BigDecimal costPrice, BigDecimal sellingPrice,
            int lowStockThreshold, boolean low, boolean active
    ) {
        public static AdminStockItemResponse from(StockItem i) {
            return new AdminStockItemResponse(i.getId(), i.getName(), i.getQuantity(), i.getCostPrice(),
                    i.getSellingPrice(), i.getLowStockThreshold(), i.getQuantity() <= i.getLowStockThreshold(), i.isActive());
        }
    }

    /** What StockManager sees - just enough to log a sale, nothing about cost/pricing. */
    public record SimpleStockItemResponse(Long id, String name) {
        public static SimpleStockItemResponse from(StockItem i) {
            return new SimpleStockItemResponse(i.getId(), i.getName());
        }
    }

    public record StockSaleResponse(
            Long id, Long stockItemId, String stockItemName, LocalDate saleDate,
            int quantitySold, BigDecimal revenueGenerated, BigDecimal profitGenerated, String enteredByName
    ) {
        public static StockSaleResponse from(StockSaleEntry e) {
            return new StockSaleResponse(e.getId(), e.getStockItem().getId(), e.getStockItem().getName(),
                    e.getSaleDate(), e.getQuantitySold(), e.getRevenueGenerated(), e.getProfitGenerated(), e.getEnteredByName());
        }
    }

    public record BestSellerResponse(Long itemId, String itemName, long totalQuantitySold, BigDecimal totalRevenue) {}
}
