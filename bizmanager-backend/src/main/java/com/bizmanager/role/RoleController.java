package com.bizmanager.role;

import com.bizmanager.security.AuthContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.bizmanager.role.RoleDtos.*;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final AuthContext authContext;

    @GetMapping
    public List<RoleResponse> listRoles() {
        return roleService.listRoles(authContext.businessId()).stream().map(RoleResponse::from).toList();
    }

    @GetMapping("/assignable")
    public List<RoleResponse> listAssignableRoles() {
        return roleService.listAssignableRoles(authContext.businessId()).stream().map(RoleResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody CreateRoleRequest req) {
        Role role = roleService.createCustomRole(req.name(), req.permissions());
        return ResponseEntity.ok(RoleResponse.from(role));
    }

    @PutMapping("/{roleId}/permissions")
    public RoleResponse updatePermissions(@PathVariable Long roleId, @RequestBody UpdateRolePermissionsRequest req) {
        return RoleResponse.from(roleService.updateRolePermissions(roleId, req.permissions()));
    }

    @DeleteMapping("/{roleId}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long roleId) {
        roleService.deleteRole(roleId);
        return ResponseEntity.noContent().build();
    }
}
