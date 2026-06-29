package com.bizmanager.ticket;

import com.bizmanager.common.AuditService;
import com.bizmanager.common.Permission;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketPricingService {

    private final TicketPricingRepository pricingRepository;
    private final AuditService auditService;
    private final AuthContext authContext;

    @Transactional
    public TicketPricing setPrice(TicketDtos.SetPriceRequest req) {
        authContext.require(Permission.MANAGE_TICKETS);
        Long businessId = authContext.businessId();

        var existing = pricingRepository.findByBusinessIdAndDayTypeAndCategoryAndActiveTrue(
                businessId, req.dayType(), req.category());

        existing.ifPresent(old -> {
            old.setActive(false);
            pricingRepository.save(old);
        });

        TicketPricing created = pricingRepository.save(TicketPricing.builder()
                .businessId(businessId)
                .dayType(req.dayType())
                .category(req.category())
                .price(req.price())
                .active(true)
                .build());

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "TICKET_PRICE_UPDATED", "TicketPricing", created.getId(),
                existing.map(TicketPricing::getPrice).orElse(null), req.price(),
                req.dayType() + "/" + req.category());

        return created;
    }

    public List<TicketPricing> listActive(Long businessId) {
        return pricingRepository.findByBusinessIdAndActiveTrue(businessId);
    }

    public List<TicketPricing> listHistory(Long businessId) {
        return pricingRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
    }
}
