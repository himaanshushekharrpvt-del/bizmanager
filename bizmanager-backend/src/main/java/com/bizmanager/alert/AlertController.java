package com.bizmanager.alert;

import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final AuthContext authContext;

    @GetMapping
    public List<Alert> listAlerts(@RequestParam(defaultValue = "false") boolean includeResolved) {
        Long businessId = authContext.businessId();
        return includeResolved ? alertService.listAll(businessId) : alertService.listActive(businessId);
    }
}
