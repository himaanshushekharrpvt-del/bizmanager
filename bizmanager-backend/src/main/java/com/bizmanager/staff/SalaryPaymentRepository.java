package com.bizmanager.staff;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryPaymentRepository extends JpaRepository<SalaryPayment, Long> {
    List<SalaryPayment> findByBusinessIdAndStaffProfileIdOrderByPeriodEndDesc(Long businessId, Long staffProfileId);
}
