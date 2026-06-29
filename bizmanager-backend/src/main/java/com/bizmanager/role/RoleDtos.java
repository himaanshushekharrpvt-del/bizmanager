package com.bizmanager.role;

import com.bizmanager.common.Permission;
import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public class RoleDtos {

    public record CreateRoleRequest(
            @NotBlank String name,
            Set<Permission> permissions
    ) {}

    public record UpdateRolePermissionsRequest(Set<Permission> permissions) {}

    public record RoleResponse(
            Long id, String name, boolean adminLevel, boolean masterAdminRole,
            boolean systemDefault, Set<Permission> permissions
    ) {
        public static RoleResponse from(Role r) {
            return new RoleResponse(r.getId(), r.getName(), r.isAdminLevel(), r.isMasterAdminRole(),
                    r.isSystemDefault(), r.getPermissions());
        }
    }
}
