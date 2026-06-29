package com.bizmanager.auth;

import com.bizmanager.business.Business;
import com.bizmanager.business.BusinessRepository;
import com.bizmanager.role.Role;
import com.bizmanager.role.RoleService;
import com.bizmanager.security.AuthenticatedUser;
import com.bizmanager.security.JwtUtil;
import com.bizmanager.user.User;
import com.bizmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

import static com.bizmanager.auth.AuthDtos.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse registerBusiness(RegisterBusinessRequest req) {
        if (userRepository.existsByPhoneIgnoreCase(req.phone())) {
            throw new IllegalArgumentException("A user with this phone number already exists");
        }

        Business business = businessRepository.save(Business.builder()
                .name(req.businessName())
                .businessType(req.businessType())
                .contactPhone(req.phone())
                .active(true)
                .build());

        Role masterAdminRole = roleService.seedDefaultRoles(business.getId());

        User masterAdmin = userRepository.save(User.builder()
                .businessId(business.getId())
                .name(req.masterAdminName())
                .phone(req.phone())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(masterAdminRole)
                .active(true)
                .lastLoginAt(LocalDateTime.now())
                .build());

        return buildAuthResponse(masterAdmin, business);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByPhoneIgnoreCase(req.phone())
                .orElseThrow(() -> new BadCredentialsException("Incorrect phone number or password"));

        if (!user.isActive()) {
            throw new BadCredentialsException("This account has been deactivated");
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Incorrect phone number or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        Business business = businessRepository.findById(user.getBusinessId())
                .orElseThrow(() -> new IllegalStateException("Business not found for user"));
        return buildAuthResponse(user, business);
    }

    private AuthResponse buildAuthResponse(User user, Business business) {
        Role role = user.getRole();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                user.getId(), user.getBusinessId(), user.getPhone(), user.getName(),
                role.getId(), role.getName(), role.isAdminLevel(), role.isMasterAdminRole(), role.getPermissions()
        );
        String token = jwtUtil.generateToken(authenticatedUser);

        return new AuthResponse(
                token, user.getId(), user.getBusinessId(), business.getName(), user.getName(), user.getPhone(),
                role.getId(), role.getName(), role.isAdminLevel(), role.isMasterAdminRole(),
                role.getPermissions().stream().map(Enum::name).collect(Collectors.toSet())
        );
    }
}
