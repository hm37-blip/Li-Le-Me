package com.lilema.controller.user;

import com.lilema.dto.ApiResponse;
import com.lilema.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserAccountController {

    private final UserService userService;

    /**
     * Update the user's display profile.
     * Request body: {"openid": "...", "nickname": "...", "avatar_url": "..."}
     */
    @PostMapping("/profile")
    public ApiResponse<Void> updateProfile(@RequestBody Map<String, String> body) {
        String openid = body.get("openid");
        if (openid == null || openid.isBlank()) {
            return ApiResponse.error(400, "openid is required");
        }

        String nickname = body.get("nickname");
        String avatarUrl = body.get("avatar_url");
        try {
            userService.updateUserProfile(openid, nickname, avatarUrl);
            return ApiResponse.success("Profile updated", null);
        } catch (RuntimeException e) {
            log.error("Update profile error for {}: {}", openid, e.getMessage());
            return ApiResponse.error(500, e.getMessage());
        }
    }

    /**
     * Delete account and related daily logs, then update squad member counts.
     * Request body: {"openid": "..."}
     */
    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(@RequestBody Map<String, String> body) {
        String openid = body.get("openid");
        if (openid == null || openid.isBlank()) {
            return ApiResponse.error(400, "openid is required");
        }

        try {
            userService.deleteAccount(openid);
            return ApiResponse.success("账号已注销", null);
        } catch (RuntimeException e) {
            log.error("Delete account error for {}: {}", openid, e.getMessage());
            return ApiResponse.error(500, e.getMessage());
        }
    }
}
