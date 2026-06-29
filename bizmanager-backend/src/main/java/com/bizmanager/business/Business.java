package com.bizmanager.business;

import com.bizmanager.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "businesses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Business extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String businessType; // free text, e.g. "Water Park", "Retail Store" - purely informational

    private String contactEmail;
    private String contactPhone;
    private String address;

    @Builder.Default
    private boolean active = true;
}
