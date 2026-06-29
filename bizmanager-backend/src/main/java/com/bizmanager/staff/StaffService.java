package com.bizmanager.staff;

import com.bizmanager.common.AuditService;
import com.bizmanager.common.BadRequestException;
import com.bizmanager.common.Permission;
import com.bizmanager.common.ResourceNotFoundException;
import com.bizmanager.role.Role;
import com.bizmanager.role.RoleRepository;
import com.bizmanager.role.RoleService;
import com.bizmanager.security.AuthContext;
import com.bizmanager.user.User;
import com.bizmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static com.bizmanager.staff.StaffDtos.*;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AuthContext authContext;

    @Transactional
    public StaffProfile createStaff(CreateStaffRequest req) {
        authContext.require(Permission.MANAGE_STAFF_HR);
        Long businessId = authContext.businessId();

        if (userRepository.existsByPhoneIgnoreCase(req.phone())) {
            throw new BadRequestException("A user with this phone number already exists");
        }
        Role staffRole = resolveStaffRole(req.roleId(), businessId);

        User user = userRepository.save(User.builder()
                .businessId(businessId)
                .name(req.name())
                .phone(req.phone())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(staffRole)
                .active(true)
                .build());

        StaffProfile profile = staffProfileRepository.save(StaffProfile.builder()
                .businessId(businessId)
                .user(user)
                .monthlySalary(req.monthlySalary())
                .joiningDate(req.joiningDate())
                .active(true)
                .build());

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "STAFF_CREATED", "StaffProfile", profile.getId(), null,
                req.name() + " / " + staffRole.getName() + " @ " + req.monthlySalary() + "/mo", null);
        return profile;
    }

    private Role resolveStaffRole(Long roleId, Long businessId) {
        Role role = roleId == null
                ? roleRepository.findByBusinessIdAndNameIgnoreCase(businessId, RoleService.STAFF)
                    .orElseThrow(() -> new ResourceNotFoundException("Staff role not found for this business"))
                : roleRepository.findByIdAndBusinessId(roleId, businessId)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (role.isAdminLevel()) {
            throw new BadRequestException("Admin roles cannot be assigned from the staff form");
        }
        return role;
    }

    @Transactional
    public StaffProfile updateSalary(Long staffProfileId, BigDecimal newMonthlySalary) {
        authContext.require(Permission.MANAGE_STAFF_HR);
        Long businessId = authContext.businessId();
        StaffProfile profile = getOwned(staffProfileId, businessId);

        BigDecimal old = profile.getMonthlySalary();
        profile.setMonthlySalary(newMonthlySalary);
        staffProfileRepository.save(profile);

        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "STAFF_SALARY_UPDATED", "StaffProfile", profile.getId(), old, newMonthlySalary,
                profile.getUser().getName());
        return profile;
    }

    /**
     * Deactivates the HR record only. If you also want to revoke login access,
     * deactivate the underlying user via the Users API separately - kept
     * decoupled so MANAGE_STAFF_HR and MANAGE_STAFF_ACCOUNTS stay independent
     * permissions, in case a business splits HR duties from account admin.
     */
    @Transactional
    public void deactivateStaff(Long staffProfileId) {
        authContext.require(Permission.MANAGE_STAFF_HR);
        Long businessId = authContext.businessId();
        StaffProfile profile = getOwned(staffProfileId, businessId);
        profile.setActive(false);
        staffProfileRepository.save(profile);
        auditService.record(businessId, authContext.userId(), authContext.currentUser().getName(),
                "STAFF_DEACTIVATED", "StaffProfile", profile.getId(), true, false, profile.getUser().getName());
    }

    public List<StaffProfile> listStaff(Long businessId) {
        return staffProfileRepository.findByBusinessId(businessId);
    }

    public StaffProfile getOwned(Long staffProfileId, Long businessId) {
        return staffProfileRepository.findByIdAndBusinessId(staffProfileId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff profile not found"));
    }

    /** Resolves the calling user's own staff profile, for the "me" self-service endpoints. */
    public StaffProfile getOwnProfile() {
        Long businessId = authContext.businessId();
        Long userId = authContext.userId();
        return staffProfileRepository.findByUserIdAndBusinessId(userId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No staff profile linked to this account"));
    }

    public LocalDateTime accrualStartFor(StaffProfile profile) {
        return profile.getLastPaidAt() != null ? profile.getLastPaidAt() : profile.getJoiningDate().atStartOfDay();
    }
}
