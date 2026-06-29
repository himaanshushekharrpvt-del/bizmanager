package com.bizmanager.staff;

import com.bizmanager.common.TenantEntity;
import com.bizmanager.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class StaffProfile extends TenantEntity {

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private BigDecimal monthlySalary;

    @Column(nullable = false)
    private LocalDate joiningDate;

    @Builder.Default
    private boolean active = true;

    /**
     * Null = never paid yet (cumulative salary accrues from joiningDate).
     * Set to "now" every time MANAGE_SALARY marks a payment - that single
     * field IS the "starts fresh from that day" reset the spec asks for;
     * cumulative salary is always computed as "PRESENT days after this date".
     */
    private LocalDateTime lastPaidAt;
}
