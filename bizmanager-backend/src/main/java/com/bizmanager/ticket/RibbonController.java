package com.bizmanager.ticket;

import com.bizmanager.security.AuthContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.bizmanager.ticket.TicketDtos.*;

@RestController
@RequestMapping("/api/ribbons")
@RequiredArgsConstructor
public class RibbonController {

    private final RibbonService ribbonService;
    private final AuthContext authContext;

    @GetMapping
    public List<RibbonStockResponse> listStock() {
        return ribbonService.listStock(authContext.businessId()).stream().map(RibbonStockResponse::from).toList();
    }

    @PostMapping("/restock")
    public RibbonStockResponse restock(@Valid @RequestBody RestockRibbonsRequest req) {
        return RibbonStockResponse.from(ribbonService.restock(req.category(), req.quantity()));
    }

    @PutMapping("/threshold")
    public RibbonStockResponse setThreshold(@Valid @RequestBody SetRibbonThresholdRequest req) {
        return RibbonStockResponse.from(ribbonService.setThreshold(req.category(), req.threshold()));
    }
}
