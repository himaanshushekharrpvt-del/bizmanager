package com.bizmanager.analytics;

import com.bizmanager.alert.AlertService;
import com.bizmanager.common.AttendanceStatus;
import com.bizmanager.common.Permission;
import com.bizmanager.expense.ExpenseService;
import com.bizmanager.security.AuthContext;
import com.bizmanager.staff.AttendanceRepository;
import com.bizmanager.stock.StockDtos;
import com.bizmanager.stock.StockService;
import com.bizmanager.ticket.DailyTicketSale;
import com.bizmanager.ticket.DailyTicketSaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

import static com.bizmanager.analytics.AnalyticsDtos.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final DailyTicketSaleRepository ticketSaleRepository;
    private final ExpenseService expenseService;
    private final StockService stockService;
    private final AttendanceRepository attendanceRepository;
    private final AlertService alertService;
    private final AuthContext authContext;

    public RevenueSummaryResponse revenueSummary(Long businessId, LocalDate from, LocalDate to) {
        authContext.require(Permission.VIEW_REPORTS);
        BigDecimal ticketRevenue = ticketSaleRepository.sumRevenueInRange(businessId, from, to);
        long adultSold = ticketSaleRepository.sumAdultSoldInRange(businessId, from, to);
        long childSold = ticketSaleRepository.sumChildSoldInRange(businessId, from, to);

        BigDecimal stockRevenue = stockService.totalRevenueInRange(businessId, from, to);
        BigDecimal stockProfit = stockService.totalProfitInRange(businessId, from, to);

        BigDecimal totalExpenses = expenseService.totalInRange(businessId, from, to);
        BigDecimal staffCost = attendanceRepository.sumStaffCostInRange(businessId, from, to);

        BigDecimal revenueAfterExpenses = ticketRevenue.add(stockRevenue).subtract(totalExpenses);
        BigDecimal netProfit = revenueAfterExpenses.subtract(staffCost);

        return new RevenueSummaryResponse(from, to, ticketRevenue, adultSold, childSold,
                stockRevenue, stockProfit, totalExpenses, staffCost, revenueAfterExpenses, netProfit);
    }

    public DashboardResponse todayDashboard(Long businessId) {
        authContext.require(Permission.VIEW_REPORTS);
        LocalDate today = LocalDate.now();

        DailyTicketSale todaySale = ticketSaleRepository.findByBusinessIdAndSaleDate(businessId, today).orElse(null);
        BigDecimal ticketRevenueToday = todaySale != null ? todaySale.getTotalRevenue() : BigDecimal.ZERO;
        int adultSoldToday = todaySale != null ? todaySale.getAdultSold() : 0;
        int childSoldToday = todaySale != null ? todaySale.getChildSold() : 0;

        BigDecimal stockRevenueToday = stockService.totalRevenueInRange(businessId, today, today);
        BigDecimal expensesToday = expenseService.totalInRange(businessId, today, today);
        BigDecimal revenueAfterExpensesToday = ticketRevenueToday.add(stockRevenueToday).subtract(expensesToday);

        List<StockDtos.BestSellerResponse> topToday = stockService.bestSellersByQuantity(businessId, today, today, 1);
        StockDtos.BestSellerResponse topItem = topToday.isEmpty() ? null : topToday.get(0);

        var todayAttendance = attendanceRepository.findByBusinessIdAndAttendanceDateOrderByStaffProfileIdAsc(businessId, today);
        int presentToday = (int) todayAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        int absentToday = (int) todayAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();

        long activeAlerts = alertService.listActive(businessId).size();

        return new DashboardResponse(today, ticketRevenueToday, adultSoldToday, childSoldToday,
                stockRevenueToday, expensesToday, revenueAfterExpensesToday, topItem,
                presentToday, absentToday, activeAlerts);
    }

    public InsightsResponse insights(Long businessId, LocalDate from, LocalDate to) {
        authContext.require(Permission.VIEW_REPORTS);
        List<StockDtos.BestSellerResponse> bestSellers = stockService.bestSellersByQuantity(businessId, from, to, 5);

        List<ExpenseBreakdownItem> breakdown = expenseService.breakdownInRange(businessId, from, to).stream()
                .map(row -> new ExpenseBreakdownItem(row.getItemName(), row.getTotal()))
                .toList();

        long adultSold = ticketSaleRepository.sumAdultSoldInRange(businessId, from, to);
        long childSold = ticketSaleRepository.sumChildSoldInRange(businessId, from, to);

        List<DailyTicketSale> dailySales = ticketSaleRepository
                .findByBusinessIdAndSaleDateBetweenOrderBySaleDateAsc(businessId, from, to);

        BigDecimal totalTicketRevenue = ticketSaleRepository.sumRevenueInRange(businessId, from, to);
        long daysInRange = ChronoUnit.DAYS.between(from, to) + 1;
        BigDecimal avgDailyRevenue = daysInRange > 0
                ? totalTicketRevenue.divide(BigDecimal.valueOf(daysInRange), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        DayRevenue busiest = dailySales.stream()
                .max(Comparator.comparing(DailyTicketSale::getTotalRevenue))
                .map(s -> new DayRevenue(s.getSaleDate(), s.getTotalRevenue()))
                .orElse(null);
        DayRevenue slowest = dailySales.stream()
                .min(Comparator.comparing(DailyTicketSale::getTotalRevenue))
                .map(s -> new DayRevenue(s.getSaleDate(), s.getTotalRevenue()))
                .orElse(null);

        return new InsightsResponse(from, to, bestSellers, breakdown, adultSold, childSold,
                avgDailyRevenue, busiest, slowest);
    }
}
