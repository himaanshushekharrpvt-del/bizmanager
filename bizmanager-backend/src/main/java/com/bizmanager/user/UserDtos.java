package com.bizmanager.user;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class UserDtos {

    public record CreateAdminRequest(
            @NotBlank String name,
            @NotBlank String phone,
            @NotBlank @Size(min = 6) String password
    ) {}

    public record CreateStaffAccountRequest(
            @NotBlank String name,
            @NotBlank String phone,
            @NotBlank @Size(min = 6) String password,
            Long roleId
    ) {}

    public record ResetPasswordRequest(@NotBlank @Size(min = 6) String newPassword) {}

    public record UserResponse(
            Long id, String name, String phone,
            Long roleId, String roleName, boolean active, LocalDateTime lastLoginAt
    ) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getName(), u.getPhone(),
                    u.getRole().getId(), u.getRole().getName(), u.isActive(), u.getLastLoginAt());
        }
    }
}