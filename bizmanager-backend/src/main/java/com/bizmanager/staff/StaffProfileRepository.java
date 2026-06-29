package com.bizmanager.staff;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffProfileRepository extends JpaRepository<StaffProfile, Long> {
    List<StaffProfile> findByBusinessId(Long businessId);

    Optional<StaffProfile> findByIdAndBusinessId(Long id, Long businessId);

    Optional<StaffProfile> findByUserIdAndBusinessId(Long userId, Long businessId);
}
