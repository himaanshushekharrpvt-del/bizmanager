package com.bizmanager.ticket;

import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.DayType;
import com.bizmanager.common.Permission;
import com.bizmanager.common.TicketCategory;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static com.bizmanager.ticket.TicketDtos.EnterDailyTicketSaleRequest;

@Service
@RequiredArgsConstructor
public class TicketSaleService {

    private final DailyTicketSaleRepository saleRepository;
    private final TicketPricingRepository pricingRepository;
    private final RibbonService ribbonService;
    private final AuditService auditService;
    private final AuthContext authContext;

    /**
     * Upserts the sale for a given date. Re-submitting the same date is treated as a
     * correction: ribbon stock is adjusted by the DELTA, not the full new amount, and
     * the correction itself is audited (old values -> new values).
     */
    @Transactional
    public DailyTicketSale enterOrCorrectSale(EnterDailyTicketSaleRequest req) {
        authContext.require(Permission.ENTER_TICKET_SALES);
        Long businessId = authContext.businessId();
        DayType dayType = DayType.forDate(req.saleDate());

        BigDecimal adultPrice = activePrice(businessId, dayType, TicketCategory.ADULT);
        BigDecimal childPrice = activePrice(businessId, dayType, TicketCategory.CHILD);

        var existingOpt = saleRepository.findByBusinessIdAndSaleDate(businessId, req.saleDate());

        if (existingOpt.isEmpty()) {
            ribbonService.consumeForSale(businessId, TicketCategory.ADULT, req.adultSold());
            ribbonService.consumeForSale(businessId, TicketCategory.CHILD, req.childSold());

            DailyTicketSale sale = buildSale(businessId, req, dayType, adultPrice, childPrice);
            DailyTicketSale saved = saleRepository.save(sale);

            auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                    "TICKET_SALE_ENTERED", "DailyTicketSale", saved.getId(), null,
                    req.adultSold() + " adult / " + req.childSold() + " child", req.saleDate().toString());
            return saved;
        }

        DailyTicketSale existing = existingOpt.get();
        String oldSnapshot = existing.getAdultSold() + " adult / " + existing.getChildSold() + " child";

        int adultDelta = req.adultSold() - existing.getAdultSold();
        int childDelta = req.childSold() - existing.getChildSold();
        applyDelta(businessId, TicketCategory.ADULT, adultDelta);
        applyDelta(businessId, TicketCategory.CHILD, childDelta);

        existing.setDayType(dayType);
        existing.setAdultSold(req.adultSold());
        existing.setChildSold(req.childSold());
        existing.setAdultPriceUsed(adultPrice);
        existing.setChildPriceUsed(childPrice);
        existing.setAdultRevenue(adultPrice.multiply(BigDecimal.valueOf(req.adultSold())));
        existing.setChildRevenue(childPrice.multiply(BigDecimal.valueOf(req.childSold())));
        existing.setTotalRevenue(existing.getAdultRevenue().add(existing.getChildRevenue()));
        DailyTicketSale saved = saleRepository.save(existing);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "TICKET_SALE_CORRECTED", "DailyTicketSale", saved.getId(), oldSnapshot,
                req.adultSold() + " adult / " + req.childSold() + " child", req.saleDate().toString());
        return saved;
    }

    private void applyDelta(Long businessId, TicketCategory category, int delta) {
        if (delta > 0) ribbonService.consumeForSale(businessId, category, delta);
        else if (delta < 0) ribbonService.giveBack(businessId, category, -delta);
    }

    private DailyTicketSale buildSale(Long businessId, EnterDailyTicketSaleRequest req, DayType dayType,
                                       BigDecimal adultPrice, BigDecimal childPrice) {
        BigDecimal adultRevenue = adultPrice.multiply(BigDecimal.valueOf(req.adultSold()));
        BigDecimal childRevenue = childPrice.multiply(BigDecimal.valueOf(req.childSold()));
        return DailyTicketSale.builder()
                .businessId(businessId)
                .saleDate(req.saleDate())
                .dayType(dayType)
                .adultSold(req.adultSold())
                .childSold(req.childSold())
                .adultPriceUsed(adultPrice)
                .childPriceUsed(childPrice)
                .adultRevenue(adultRevenue)
                .childRevenue(childRevenue)
                .totalRevenue(adultRevenue.add(childRevenue))
                .build();
    }

    private BigDecimal activePrice(Long businessId, DayType dayType, TicketCategory category) {
        return pricingRepository.findByBusinessIdAndDayTypeAndCategoryAndActiveTrue(businessId, dayType, category)
                .map(TicketPricing::getPrice)
                .orElseThrow(() -> new BadRequestException(
                        "No active " + category + " price set for " + dayType + " - set ticket prices first"));
    }

    public List<DailyTicketSale> listInRange(Long businessId, LocalDate from, LocalDate to) {
        return saleRepository.findByBusinessIdAndSaleDateBetweenOrderBySaleDateAsc(businessId, from, to);
    }
}
