package com.bizmanager.analytics;

import com.bizmanager.stock.StockDtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class AnalyticsDtos {

    public record RevenueSummaryResponse(
            LocalDate from, LocalDate to,
            BigDecimal ticketRevenue, long adultTicketsSold, long childTicketsSold,
            BigDecimal stockRevenue, BigDecimal stockProfit,
            BigDecimal totalExpenses, BigDecimal staffCost,
            BigDecimal revenueAfterExpenses,
            BigDecimal netProfitAfterStaffCost
    ) {}

    public record DashboardResponse(
            LocalDate date,
            BigDecimal ticketRevenueToday, int adultSoldToday, int childSoldToday,
            BigDecimal stockRevenueToday, BigDecimal expensesToday, BigDecimal revenueAfterExpensesToday,
            StockDtos.BestSellerResponse topSellingItemToday,
            int staffPresentToday, int staffAbsentToday,
            long activeAlertsCount
    ) {}

    public record ExpenseBreakdownItem(String itemName, BigDecimal total) {}

    public record DayRevenue(LocalDate date, BigDecimal revenue) {}

    public record InsightsResponse(
            LocalDate from, LocalDate to,
            List<StockDtos.BestSellerResponse> bestSellingItems,
            List<ExpenseBreakdownItem> expenseBreakdown,
            long totalAdultTickets, long totalChildTickets,
            BigDecimal averageDailyTicketRevenue,
            DayRevenue busiestTicketDay,
            DayRevenue slowestTicketDay
    ) {}
}
