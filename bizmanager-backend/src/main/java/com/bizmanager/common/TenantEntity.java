package com.bizmanager.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Almost every entity in this app belongs to exactly one Business and must
 * never leak across tenants. Extending this instead of BaseEntity directly
 * is the convention that makes that hard to forget - repositories for these
 * entities should expose ...AndBusinessId(...) lookups, never a bare
 * findById for anything reachable from a tenant-scoped controller.
 *
 * Every concrete subclass must use @SuperBuilder (see BaseEntity's javadoc).
 */
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@MappedSuperclass
public abstract class TenantEntity extends BaseEntity {

    @Column(nullable = false)
    private Long businessId;
}
