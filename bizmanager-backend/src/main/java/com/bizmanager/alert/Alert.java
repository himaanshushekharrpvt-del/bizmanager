package com.bizmanager.alert;

import com.bizmanager.common.AlertType;
import com.bizmanager.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Alert extends TenantEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertType type;

    @Column(nullable = false)
    private String message;

    /** Free-form reference to what this alert is about, e.g. "ADULT" for a ribbon category, or a stock item id. */
    private String referenceKey;

    @Builder.Default
    private boolean resolved = false;

    private LocalDateTime resolvedAt;
}
