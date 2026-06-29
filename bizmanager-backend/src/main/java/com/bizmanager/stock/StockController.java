package com.bizmanager.stock;

import com.bizmanager.common.Permission;
import com.bizmanager.security.AuthContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static com.bizmanager.stock.StockDtos.*;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;
    private final AuthContext authContext;

    /** Admin sees full details; StockManager sees name+id only - same endpoint, shaped by permission. */
    @GetMapping("/items")
    public Object listItems() {
        Long businessId = authContext.businessId();
        boolean canManage = authContext.currentUser().hasPermission(Permission.MANAGE_STOCK_ITEMS);
        var items = stockService.listActiveItems(businessId);
        return canManage
                ? items.stream().map(AdminStockItemResponse::from).toList()
                : items.stream().map(SimpleStockItemResponse::from).toList();
    }

    @PostMapping("/items")
    public AdminStockItemResponse createItem(@Valid @RequestBody CreateStockItemRequest req) {
        return AdminStockItemResponse.from(stockService.createItem(req));
    }

    @PutMapping("/items/{itemId}")
    public AdminStockItemResponse updateItem(@PathVariable Long itemId, @RequestBody UpdateStockItemRequest req) {
        return AdminStockItemResponse.from(stockService.updateItem(itemId, req));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deactivateItem(@PathVariable Long itemId) {
        stockService.deactivateItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sales")
    public StockSaleResponse logSale(@Valid @RequestBody LogStockSaleRequest req) {
        return StockSaleResponse.from(stockService.logSale(req));
    }

    @GetMapping("/sales")
    public List<StockSaleResponse> listSales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return stockService.listSalesInRange(authContext.businessId(), from, to).stream()
                .map(StockSaleResponse::from).toList();
    }

    @GetMapping("/best-sellers")
    public List<BestSellerResponse> bestSellers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit) {
        return stockService.bestSellersByQuantity(authContext.businessId(), from, to, limit);
    }
}
