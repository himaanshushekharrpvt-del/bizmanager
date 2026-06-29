package com.bizmanager.stock;

import com.bizmanager.alert.AlertService;
import com.bizmanager.common.AlertType;
import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.Permission;
import com.bizmanager.common.ResourceNotFoundException;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static com.bizmanager.stock.StockDtos.*;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockItemRepository stockItemRepository;
    private final StockSaleEntryRepository saleEntryRepository;
    private final AlertService alertService;
    private final AuditService auditService;
    private final AuthContext authContext;

    @Transactional
    public StockItem createItem(CreateStockItemRequest req) {
        authContext.require(Permission.MANAGE_STOCK_ITEMS);
        Long businessId = authContext.businessId();
        if (stockItemRepository.existsByBusinessIdAndNameIgnoreCase(businessId, req.name())) {
            throw new BadRequestException("An item named '" + req.name() + "' already exists");
        }

        StockItem item = StockItem.builder()
                .businessId(businessId)
                .name(req.name())
                .quantity(req.quantity())
                .costPrice(req.costPrice())
                .sellingPrice(req.sellingPrice())
                .lowStockThreshold(req.lowStockThreshold() == null ? 10 : req.lowStockThreshold())
                .active(true)
                .build();
        StockItem saved = stockItemRepository.save(item);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "STOCK_ITEM_CREATED", "StockItem", saved.getId(), null, req.name() + " x" + req.quantity(), null);
        checkLowStock(saved);
        return saved;
    }

    @Transactional
    public StockItem updateItem(Long itemId, UpdateStockItemRequest req) {
        authContext.require(Permission.MANAGE_STOCK_ITEMS);
        Long businessId = authContext.businessId();
        StockItem item = getOwned(itemId, businessId);

        String oldSnapshot = item.getQuantity() + " @ cost " + item.getCostPrice() + " / sell " + item.getSellingPrice();
        if (req.name() != null) item.setName(req.name());
        if (req.quantity() != null) item.setQuantity(req.quantity());
        if (req.costPrice() != null) item.setCostPrice(req.costPrice());
        if (req.sellingPrice() != null) item.setSellingPrice(req.sellingPrice());
        if (req.lowStockThreshold() != null) item.setLowStockThreshold(req.lowStockThreshold());
        StockItem saved = stockItemRepository.save(item);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "STOCK_ITEM_UPDATED", "StockItem", saved.getId(), oldSnapshot,
                saved.getQuantity() + " @ cost " + saved.getCostPrice() + " / sell " + saved.getSellingPrice(), null);
        checkLowStock(saved);
        return saved;
    }

    @Transactional
    public void deactivateItem(Long itemId) {
        authContext.require(Permission.MANAGE_STOCK_ITEMS);
        Long businessId = authContext.businessId();
        StockItem item = getOwned(itemId, businessId);
        item.setActive(false);
        stockItemRepository.save(item);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "STOCK_ITEM_DEACTIVATED", "StockItem", itemId, true, false, item.getName());
    }

    public List<StockItem> listActiveItems(Long businessId) {
        return stockItemRepository.findByBusinessIdAndActiveTrue(businessId);
    }

    public List<StockItem> listAllItems(Long businessId) {
        return stockItemRepository.findByBusinessId(businessId);
    }

    /**
     * Upsert by (item, date) - re-logging the same day/item corrects it, adjusting the
     * item's remaining quantity by the DELTA rather than double-subtracting.
     */
    @Transactional
    public StockSaleEntry logSale(LogStockSaleRequest req) {
        authContext.require(Permission.ENTER_STOCK_SALE);
        Long businessId = authContext.businessId();
        LocalDate today = LocalDate.now();
        if (!today.equals(req.saleDate())) {
            throw new BadRequestException("Stock sales can only be logged for today");
        }
        StockItem item = getOwned(req.stockItemId(), businessId);

        var existing = saleEntryRepository.findByBusinessIdAndStockItemIdAndSaleDate(businessId, item.getId(), today);
        int previousQtySold = existing.map(StockSaleEntry::getQuantitySold).orElse(0);
        int delta = req.quantitySold() - previousQtySold;

        if (delta > 0 && item.getQuantity() < delta) {
            throw new BadRequestException("Only " + item.getQuantity() + " " + item.getName() + " left in stock");
        }
        item.setQuantity(item.getQuantity() - delta);
        stockItemRepository.save(item);

        BigDecimal revenue = item.getSellingPrice().multiply(BigDecimal.valueOf(req.quantitySold()));
        BigDecimal profit = item.getSellingPrice().subtract(item.getCostPrice()).multiply(BigDecimal.valueOf(req.quantitySold()));

        StockSaleEntry saved;
        String action;
        if (existing.isPresent()) {
            StockSaleEntry e = existing.get();
            e.setQuantitySold(req.quantitySold());
            e.setRevenueGenerated(revenue);
            e.setProfitGenerated(profit);
            saved = saleEntryRepository.save(e);
            action = "STOCK_SALE_CORRECTED";
        } else {
            saved = saleEntryRepository.save(StockSaleEntry.builder()
                    .businessId(businessId)
                    .stockItem(item)
                    .saleDate(today)
                    .quantitySold(req.quantitySold())
                    .revenueGenerated(revenue)
                    .profitGenerated(profit)
                    .enteredByUserId(authContext.userId())
                    .enteredByName(authContext.currentUser().getName())
                    .build());
            action = "STOCK_SALE_LOGGED";
        }

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                action, "StockSaleEntry", saved.getId(), previousQtySold, req.quantitySold(),
                item.getName() + " / " + today);
        checkLowStock(item);
        return saved;
    }

    public List<StockSaleEntry> listSalesInRange(Long businessId, LocalDate from, LocalDate to) {
        return saleEntryRepository.findByBusinessIdAndSaleDateBetweenOrderBySaleDateAsc(businessId, from, to);
    }

    public BigDecimal totalRevenueInRange(Long businessId, LocalDate from, LocalDate to) {
        return saleEntryRepository.sumRevenueInRange(businessId, from, to);
    }

    public BigDecimal totalProfitInRange(Long businessId, LocalDate from, LocalDate to) {
        return saleEntryRepository.sumProfitInRange(businessId, from, to);
    }

    public List<BestSellerResponse> bestSellersByQuantity(Long businessId, LocalDate from, LocalDate to, int limit) {
        return saleEntryRepository.findBestSellersByQuantity(businessId, from, to).stream()
                .limit(limit)
                .map(a -> new BestSellerResponse(a.getItemId(), a.getItemName(), a.getTotalQty(), a.getTotalRevenue()))
                .toList();
    }

    public StockItem getOwned(Long itemId, Long businessId) {
        return stockItemRepository.findByIdAndBusinessId(itemId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));
    }

    private void checkLowStock(StockItem item) {
        String ref = "ITEM_" + item.getId();
        if (item.getQuantity() <= item.getLowStockThreshold()) {
            alertService.raiseIfNotAlreadyActive(item.getBusinessId(), AlertType.LOW_ITEM_STOCK, ref,
                    item.getName() + " is down to " + item.getQuantity() +
                            " units (threshold " + item.getLowStockThreshold() + ") - restock soon.");
        } else {
            alertService.resolve(item.getBusinessId(), AlertType.LOW_ITEM_STOCK, ref);
        }
    }
}
