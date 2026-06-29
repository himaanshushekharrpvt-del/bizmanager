package com.bizmanager.security;

import com.bizmanager.common.Permission;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Set;

@Getter
@AllArgsConstructor
public class AuthenticatedUser {
    private final Long userId;
    private final Long businessId;
    private final String phone;
    private final String name;
    private final Long roleId;
    private final String roleName;
    private final boolean adminLevel; // true only for MasterAdmin/Admin system roles
    private final boolean masterAdmin;
    private final Set<Permission> permissions;

    public boolean hasPermission(Permission permission) {
        return permissions != null && permissions.contains(permission);
    }
}
