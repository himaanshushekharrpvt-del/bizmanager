package com.bizmanager.user;

import com.bizmanager.security.AuthContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.bizmanager.user.UserDtos.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthContext authContext;

    @GetMapping
    public List<UserResponse> listUsers() {
        return userService.listUsers(authContext.businessId()).stream().map(UserResponse::from).toList();
    }

    @GetMapping("/{userId}")
    public UserResponse getUser(@PathVariable Long userId) {
        return UserResponse.from(userService.getOwned(userId, authContext.businessId()));
    }

    /** MasterAdmin only. */
    @PostMapping("/admins")
    public ResponseEntity<UserResponse> createAdmin(@Valid @RequestBody CreateAdminRequest req) {
        User user = userService.createAdmin(req.name(), req.phone(), req.password());
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /** Admin or MasterAdmin - for Staff/StockManager/custom roles (not Admin/MasterAdmin). */
    @PostMapping
    public ResponseEntity<UserResponse> createStaffAccount(@Valid @RequestBody CreateStaffAccountRequest req) {
        User user = userService.createStaffAccount(req.name(), req.phone(), req.password(), req.roleId());
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long userId, @Valid @RequestBody ResetPasswordRequest req) {
        userService.resetPassword(userId, req.newPassword());
        return ResponseEntity.noContent().build();
    }
}
