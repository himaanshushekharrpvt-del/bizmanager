package com.bizmanager.user;

import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.Permission;
import com.bizmanager.common.ResourceNotFoundException;
import com.bizmanager.role.Role;
import com.bizmanager.role.RoleRepository;
import com.bizmanager.security.AuthContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AuthContext authContext;

    /** MasterAdmin only - this is THE difference between Admin and MasterAdmin from the spec. */
    @Transactional
    public User createAdmin(String name, String phone, String rawPassword) {
        authContext.requireMasterAdmin();
        Long businessId = authContext.businessId();

        Role adminRole = roleRepository.findByBusinessIdAndNameIgnoreCase(businessId, "Admin")
                .orElseThrow(() -> new ResourceNotFoundException("Admin role not found for this business"));

        User user = createUserInternal(businessId, name, phone, rawPassword, adminRole);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "ADMIN_CREATED", "User", user.getId(), null, phone, null);
        return user;
    }

    /** Admin or MasterAdmin - for Staff/StockManager/custom roles. Blocks assigning an admin-tier role here. */
    @Transactional
    public User createStaffAccount(String name, String phone, String rawPassword, Long roleId) {
        authContext.require(Permission.MANAGE_STAFF_ACCOUNTS);
        Long businessId = authContext.businessId();

        Role role = roleRepository.findByIdAndBusinessId(roleId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        if (role.isAdminLevel()) {
            throw new BadRequestException("Admin-tier roles can't be assigned through this endpoint");
        }

        User user = createUserInternal(businessId, name, phone, rawPassword, role);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "STAFF_ACCOUNT_CREATED", "User", user.getId(), null, phone + " (" + role.getName() + ")", null);
        return user;
    }

    private User createUserInternal(Long businessId, String name, String phone, String rawPassword, Role role) {
        if (userRepository.existsByPhoneIgnoreCase(phone)) {
            throw new BadRequestException("A user with this phone number already exists");
        }
        User user = User.builder()
                .businessId(businessId)
                .name(name)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    /** "Remove" = deactivate, not hard-delete - this user may be referenced by years of sales/attendance/audit history. */
    @Transactional
    public void deactivateUser(Long userId) {
        Long businessId = authContext.businessId();
        User user = userRepository.findByIdAndBusinessId(userId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole().isMasterAdminRole()) {
            throw new BadRequestException("The MasterAdmin account can't be deactivated");
        }
        authContext.require(user.getRole().isAdminLevel() ? Permission.MANAGE_ADMINS : Permission.MANAGE_STAFF_ACCOUNTS);

        user.setActive(false);
        userRepository.save(user);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "USER_DEACTIVATED", "User", user.getId(), true, false, null);
    }

    @Transactional
    public void resetPassword(Long userId, String newRawPassword) {
        Long businessId = authContext.businessId();
        User user = userRepository.findByIdAndBusinessId(userId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        authContext.require(user.getRole().isAdminLevel() ? Permission.MANAGE_ADMINS : Permission.MANAGE_STAFF_ACCOUNTS);

        user.setPasswordHash(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "PASSWORD_RESET", "User", user.getId(), null, null, "Password reset by admin");
    }

    public List<User> listUsers(Long businessId) {
        return userRepository.findByBusinessId(businessId);
    }

    public User getOwned(Long userId, Long businessId) {
        return userRepository.findByIdAndBusinessId(userId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
