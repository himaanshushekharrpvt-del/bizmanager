package com.bizmanager.ticket;

import com.bizmanager.common.DayType;
import com.bizmanager.common.TicketCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TicketDtos {

    public record SetPriceRequest(
            @NotNull DayType dayType,
            @NotNull TicketCategory category,
            @NotNull @Min(0) BigDecimal price
    ) {}

    public record PricingResponse(
            Long id, DayType dayType, TicketCategory category, BigDecimal price, boolean active
    ) {
        public static PricingResponse from(TicketPricing p) {
            return new PricingResponse(p.getId(), p.getDayType(), p.getCategory(), p.getPrice(), p.isActive());
        }
    }

    public record RestockRibbonsRequest(
            @NotNull TicketCategory category,
            @Min(1) int quantity
    ) {}

    public record SetRibbonThresholdRequest(
            @NotNull TicketCategory category,
            @Min(0) int threshold
    ) {}

    public record RibbonStockResponse(
            Long id, TicketCategory category, int quantityAvailable, int lowStockThreshold, boolean low
    ) {
        public static RibbonStockResponse from(RibbonStock r) {
            return new RibbonStockResponse(r.getId(), r.getCategory(), r.getQuantityAvailable(),
                    r.getLowStockThreshold(), r.getQuantityAvailable() <= r.getLowStockThreshold());
        }
    }

    public record EnterDailyTicketSaleRequest(
            @NotNull LocalDate saleDate,
            @Min(0) int adultSold,
            @Min(0) int childSold
    ) {}

    public record DailyTicketSaleResponse(
            Long id, LocalDate saleDate, DayType dayType, int adultSold, int childSold,
            BigDecimal adultPriceUsed, BigDecimal childPriceUsed,
            BigDecimal adultRevenue, BigDecimal childRevenue, BigDecimal totalRevenue
    ) {
        public static DailyTicketSaleResponse from(DailyTicketSale s) {
            return new DailyTicketSaleResponse(s.getId(), s.getSaleDate(), s.getDayType(), s.getAdultSold(), s.getChildSold(),
                    s.getAdultPriceUsed(), s.getChildPriceUsed(), s.getAdultRevenue(), s.getChildRevenue(), s.getTotalRevenue());
        }
    }
}
