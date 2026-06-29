package com.bizmanager.auth;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public class AuthDtos {

    public record RegisterBusinessRequest(
            @NotBlank String businessName,
            String businessType,
            @NotBlank String masterAdminName,
            @NotBlank String phone,
            @NotBlank @Size(min = 6) String password
    ) {}

    public record LoginRequest(
            @NotBlank String phone,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            Long userId,
            Long businessId,
            String businessName,
            String name,
            String phone,
            Long roleId,
            String roleName,
            boolean adminLevel,
            boolean masterAdmin,
            Set<String> permissions
    ) {}
}