package com.bizmanager.analytics;

import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

import static com.bizmanager.analytics.AnalyticsDtos.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final AuthContext authContext;

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return analyticsService.todayDashboard(authContext.businessId());
    }

    /**
     * One range-based endpoint covers daily/weekly/monthly/yearly/custom -
     * the frontend just computes from/to for whichever preset the user picked
     * (e.g. "this month" -> first/last day of current month) and calls this.
     */
    @GetMapping("/revenue")
    public RevenueSummaryResponse revenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return analyticsService.revenueSummary(authContext.businessId(), from, to);
    }

    @GetMapping("/insights")
    public InsightsResponse insights(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return analyticsService.insights(authContext.businessId(), from, to);
    }
}
