package com.bizmanager.ticket;

import com.bizmanager.security.AuthContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static com.bizmanager.ticket.TicketDtos.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketPricingService pricingService;
    private final TicketSaleService saleService;
    private final AuthContext authContext;

    @GetMapping("/pricing")
    public List<PricingResponse> activePricing() {
        return pricingService.listActive(authContext.businessId()).stream().map(PricingResponse::from).toList();
    }

    @GetMapping("/pricing/history")
    public List<PricingResponse> pricingHistory() {
        return pricingService.listHistory(authContext.businessId()).stream().map(PricingResponse::from).toList();
    }

    @PostMapping("/pricing")
    public PricingResponse setPrice(@Valid @RequestBody SetPriceRequest req) {
        return PricingResponse.from(pricingService.setPrice(req));
    }

    @PostMapping("/sales")
    public DailyTicketSaleResponse enterSale(@Valid @RequestBody EnterDailyTicketSaleRequest req) {
        return DailyTicketSaleResponse.from(saleService.enterOrCorrectSale(req));
    }

    @GetMapping("/sales")
    public List<DailyTicketSaleResponse> listSales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return saleService.listInRange(authContext.businessId(), from, to).stream()
                .map(DailyTicketSaleResponse::from).toList();
    }
}
