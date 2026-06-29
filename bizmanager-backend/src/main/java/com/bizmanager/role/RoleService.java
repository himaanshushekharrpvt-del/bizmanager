package com.bizmanager.role;

import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.Permission;
import com.bizmanager.common.ResourceNotFoundException;
import com.bizmanager.security.AuthContext;
import com.bizmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final AuthContext authContext;

    public static final String MASTER_ADMIN = "MasterAdmin";
    public static final String ADMIN = "Admin";
    public static final String STAFF = "Staff";
    public static final String STOCK_MANAGER = "StockManager";

    /** Called once at business registration. Returns the seeded MasterAdmin role so the first user can be assigned to it. */
    @Transactional
    public Role seedDefaultRoles(Long businessId) {
        Role masterAdmin = roleRepository.save(Role.builder()
                .businessId(businessId).name(MASTER_ADMIN)
                .adminLevel(true).masterAdminRole(true).systemDefault(true)
                .permissions(EnumSet.allOf(Permission.class))
                .build());

        Set<Permission> adminPermissions = EnumSet.allOf(Permission.class);
        adminPermissions.remove(Permission.MANAGE_ADMINS);
        adminPermissions.remove(Permission.MANAGE_ROLES);
        roleRepository.save(Role.builder()
                .businessId(businessId).name(ADMIN)
                .adminLevel(true).masterAdminRole(false).systemDefault(true)
                .permissions(adminPermissions)
                .build());

        roleRepository.save(Role.builder()
                .businessId(businessId).name(STAFF)
                .adminLevel(false).masterAdminRole(false).systemDefault(true)
                .permissions(Set.of())
                .build());

        roleRepository.save(Role.builder()
                .businessId(businessId).name(STOCK_MANAGER)
                .adminLevel(false).masterAdminRole(false).systemDefault(true)
                .permissions(Set.of(Permission.ENTER_STOCK_SALE))
                .build());

        return masterAdmin;
    }

    public List<Role> listRoles(Long businessId) {
        return roleRepository.findByBusinessId(businessId);
    }

    /** Roles assignable through the generic "create staff account" flow - i.e. everything except the admin-tier roles. */
    public List<Role> listAssignableRoles(Long businessId) {
        return roleRepository.findByBusinessId(businessId).stream()
                .filter(r -> !r.isAdminLevel())
                .toList();
    }

    @Transactional
    public Role createCustomRole(String name, Set<Permission> permissions) {
        authContext.requireMasterAdmin();
        Long businessId = authContext.businessId();

        if (roleRepository.existsByBusinessIdAndNameIgnoreCase(businessId, name)) {
            throw new BadRequestException("A role named '" + name + "' already exists");
        }

        Role role = roleRepository.save(Role.builder()
                .businessId(businessId).name(name)
                .adminLevel(false).masterAdminRole(false).systemDefault(false)
                .permissions(permissions == null ? Set.of() : permissions)
                .build());

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "ROLE_CREATED", "Role", role.getId(), null, role.getName(), null);
        return role;
    }

    @Transactional
    public Role updateRolePermissions(Long roleId, Set<Permission> permissions) {
        authContext.requireMasterAdmin();
        Long businessId = authContext.businessId();
        Role role = getOwned(roleId, businessId);

        if (role.isSystemDefault()) {
            throw new BadRequestException("Default roles' permissions can't be edited - create a custom role instead");
        }

        Set<Permission> old = Set.copyOf(role.getPermissions());
        role.setPermissions(permissions == null ? Set.of() : permissions);
        roleRepository.save(role);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "ROLE_PERMISSIONS_UPDATED", "Role", role.getId(), old, role.getPermissions(), null);
        return role;
    }

    @Transactional
    public void deleteRole(Long roleId) {
        authContext.requireMasterAdmin();
        Long businessId = authContext.businessId();
        Role role = getOwned(roleId, businessId);

        if (role.isSystemDefault()) {
            throw new BadRequestException("The default roles can't be deleted");
        }
        if (userRepository.countByRoleId(roleId) > 0) {
            throw new BadRequestException("Reassign every user with this role before deleting it");
        }

        roleRepository.delete(role);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "ROLE_DELETED", "Role", roleId, role.getName(), null, null);
    }

    public Role getOwned(Long roleId, Long businessId) {
        return roleRepository.findByIdAndBusinessId(roleId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
    }
}
