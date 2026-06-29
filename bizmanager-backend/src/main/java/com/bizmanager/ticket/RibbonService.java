package com.bizmanager.ticket;

import com.bizmanager.common.AlertType;
import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.Permission;
import com.bizmanager.common.TicketCategory;
import com.bizmanager.alert.AlertService;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RibbonService {

    private final RibbonStockRepository ribbonStockRepository;
    private final AlertService alertService;
    private final AuditService auditService;
    private final AuthContext authContext;

    @Value("${app.ribbons.low-stock-threshold:200}")
    private int defaultThreshold;

    @Transactional
    public RibbonStock restock(TicketCategory category, int quantity) {
        authContext.require(Permission.MANAGE_RIBBONS);
        Long businessId = authContext.businessId();
        RibbonStock stock = getOrCreate(businessId, category);
        int old = stock.getQuantityAvailable();

        RibbonStock updated = adjustQuantity(stock, quantity);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "RIBBONS_RESTOCKED", "RibbonStock", stock.getId(), old, updated.getQuantityAvailable(), category.name());
        return updated;
    }

    @Transactional
    public RibbonStock setThreshold(TicketCategory category, int threshold) {
        authContext.require(Permission.MANAGE_RIBBONS);
        Long businessId = authContext.businessId();
        RibbonStock stock = getOrCreate(businessId, category);
        int old = stock.getLowStockThreshold();
        stock.setLowStockThreshold(threshold);
        ribbonStockRepository.save(stock);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "RIBBON_THRESHOLD_UPDATED", "RibbonStock", stock.getId(), old, threshold, category.name());
        recheckAlert(stock);
        return stock;
    }

    /** Called by TicketSaleService - no permission check here, the sale-entry action already checked its own. */
    @Transactional
    public void consumeForSale(Long businessId, TicketCategory category, int quantity) {
        if (quantity == 0) return;
        RibbonStock stock = getOrCreate(businessId, category);
        if (stock.getQuantityAvailable() < quantity) {
            throw new BadRequestException("Not enough " + category + " ribbons left (" +
                    stock.getQuantityAvailable() + " available, " + quantity + " needed). Restock first.");
        }
        adjustQuantity(stock, -quantity);
    }

    /** Used when a previously entered sale is corrected downward - gives ribbons back to the pool. */
    @Transactional
    public void giveBack(Long businessId, TicketCategory category, int quantity) {
        if (quantity <= 0) return;
        RibbonStock stock = getOrCreate(businessId, category);
        adjustQuantity(stock, quantity);
    }

    public List<RibbonStock> listStock(Long businessId) {
        return ribbonStockRepository.findByBusinessId(businessId);
    }

    private RibbonStock adjustQuantity(RibbonStock stock, int delta) {
        stock.setQuantityAvailable(stock.getQuantityAvailable() + delta);
        RibbonStock saved = ribbonStockRepository.save(stock);
        recheckAlert(saved);
        return saved;
    }

    private void recheckAlert(RibbonStock stock) {
        String ref = stock.getCategory().name();
        if (stock.getQuantityAvailable() <= stock.getLowStockThreshold()) {
            alertService.raiseIfNotAlreadyActive(stock.getBusinessId(), AlertType.LOW_RIBBON_STOCK, ref,
                    stock.getCategory() + " ribbons are down to " + stock.getQuantityAvailable() +
                            " (threshold " + stock.getLowStockThreshold() + ") - restock soon.");
        } else {
            alertService.resolve(stock.getBusinessId(), AlertType.LOW_RIBBON_STOCK, ref);
        }
    }

    private RibbonStock getOrCreate(Long businessId, TicketCategory category) {
        return ribbonStockRepository.findByBusinessIdAndCategory(businessId, category)
                .orElseGet(() -> ribbonStockRepository.save(RibbonStock.builder()
                        .businessId(businessId)
                        .category(category)
                        .quantityAvailable(0)
                        .lowStockThreshold(defaultThreshold)
                        .build()));
    }
}
