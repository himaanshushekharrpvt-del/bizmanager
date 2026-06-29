package com.bizmanager.analytics;

import com.bizmanager.common.AuditLog;
import com.bizmanager.common.AuditService;
import com.bizmanager.common.Permission;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/audit-log")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditService auditService;
    private final AuthContext authContext;

    @GetMapping
    public Page<AuditLog> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        authContext.require(Permission.VIEW_AUDIT_LOG);
        Long businessId = authContext.businessId();
        PageRequest pageRequest = PageRequest.of(page, size);

        if (entityType != null) {
            return auditService.findForEntityType(businessId, entityType, pageRequest);
        }
        if (from != null && to != null) {
            return auditService.findForBusinessInRange(businessId, from, to, pageRequest);
        }
        return auditService.findForBusiness(businessId, pageRequest);
    }
}
