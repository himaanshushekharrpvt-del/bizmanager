package com.bizmanager.role;

import com.bizmanager.common.Permission;
import com.bizmanager.common.TenantEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Role extends TenantEntity {

    @Column(nullable = false)
    private String name;

    /** True only for the seeded MasterAdmin/Admin roles. Drives the "can't be assigned via the generic create-user endpoint" rule. */
    @Builder.Default
    private boolean adminLevel = false;

    /** True only for MasterAdmin. There can only be one MasterAdmin "slot" conceptually, but we don't hard-limit the row count - see RoleService. */
    @Builder.Default
    private boolean masterAdminRole = false;

    /** True for the 4 seeded roles - prevents deletion. */
    @Builder.Default
    private boolean systemDefault = false;

    @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
    @CollectionTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission")
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();
}
