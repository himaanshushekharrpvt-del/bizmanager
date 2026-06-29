package com.bizmanager.security;

import com.bizmanager.common.Permission;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthContext {

    public AuthenticatedUser currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof AuthenticatedUser user)) {
            throw new AccessDeniedException("Not authenticated");
        }
        return user;
    }

    public Long businessId() {
        return currentUser().getBusinessId();
    }

    public Long userId() {
        return currentUser().getUserId();
    }

    /** Throws 403 if the current user doesn't have the given permission. */
    public void require(Permission permission) {
        if (!currentUser().hasPermission(permission)) {
            throw new AccessDeniedException("Missing permission: " + permission);
        }
    }

    /** For the two hardcoded admin-tier checks (creating Admins, creating roles) that aren't just a permission bundle. */
    public void requireMasterAdmin() {
        if (!currentUser().isMasterAdmin()) {
            throw new AccessDeniedException("MasterAdmin only");
        }
    }

    public boolean isSelf(Long userId) {
        return currentUser().getUserId().equals(userId);
    }
}
