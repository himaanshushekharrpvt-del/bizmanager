package com.bizmanager.role;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findByBusinessId(Long businessId);

    Optional<Role> findByIdAndBusinessId(Long id, Long businessId);

    Optional<Role> findByBusinessIdAndMasterAdminRoleTrue(Long businessId);

    Optional<Role> findByBusinessIdAndNameIgnoreCase(Long businessId, String name);

    boolean existsByBusinessIdAndNameIgnoreCase(Long businessId, String name);
}
