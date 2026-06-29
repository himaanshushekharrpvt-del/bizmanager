package com.bizmanager.alert;

import com.bizmanager.common.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByBusinessIdAndResolvedFalseOrderByCreatedAtDesc(Long businessId);

    List<Alert> findByBusinessIdOrderByCreatedAtDesc(Long businessId);

    Optional<Alert> findByBusinessIdAndTypeAndReferenceKeyAndResolvedFalse(Long businessId, AlertType type, String referenceKey);
}
