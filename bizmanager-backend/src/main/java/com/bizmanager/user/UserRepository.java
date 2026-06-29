package com.bizmanager.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhoneIgnoreCase(String phone);

    boolean existsByPhoneIgnoreCase(String phone);

    Optional<User> findByIdAndBusinessId(Long id, Long businessId);

    List<User> findByBusinessId(Long businessId);

    List<User> findByBusinessIdAndRoleId(Long businessId, Long roleId);

    long countByRoleId(Long roleId);

    // Explicit underscore to disambiguate the nested Role.adminLevel path for Spring Data's query parser.
    long countByBusinessIdAndRole_AdminLevelTrue(Long businessId);
}
