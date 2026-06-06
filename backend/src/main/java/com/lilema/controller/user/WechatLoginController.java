package com.lilema.controller.user;

import com.lilema.dto.ApiResponse;
import com.lilema.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WechatLoginController {

    private final UserService userService;

    /**
     * POST /api/auth/login
     * <p>
     * Exchange a WeChat js_code for an openid.
     * Request body: {"js_code": "..."}
     * Response: {"openid": "...", "registration_status": "new"|"existing"}
     */
    @PostMapping("/auth/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String jsCode = body.get("js_code");
        if (jsCode == null || jsCode.isBlank()) {
            return ApiResponse.error(400, "js_code is required");
        }
        try {
            Map<String, Object> result = userService.wechatLogin(jsCode);
            return ApiResponse.success(result);
        } catch (RuntimeException e) {
            log.error("WeChat login error: {}", e.getMessage());
            return ApiResponse.error(500, e.getMessage());
        }
    }

    /**
     * POST /api/auth/bind-lc
     * <p>
     * Bind a LeetCode account to the current user.
     * Request body: {"openid": "...", "lc_username": "..."}
     */
    @PostMapping("/auth/bind-lc")
    public ApiResponse<Void> bindLeetCode(@RequestBody Map<String, String> body) {
        String openid = body.get("openid");
        String lcUsername = body.get("lc_username");
        if (openid == null || openid.isBlank()) {
            return ApiResponse.error(400, "openid is required");
        }
        if (lcUsername == null || lcUsername.isBlank()) {
            return ApiResponse.error(400, "lc_username is required");
        }
        try {
            userService.bindLeetCode(openid, lcUsername);
            return ApiResponse.success("LeetCode account bound successfully", null);
        } catch (RuntimeException e) {
            log.error("Bind LC error for {}: {}", openid, e.getMessage());
            return ApiResponse.error(500, e.getMessage());
        }
    }

    /**
     * POST /api/user/profile
     * <p>
     * Update the user's display profile.
     * Request body: {"openid": "...", "nickname": "...", "avatar_url": "..."}
     */
    @PostMapping("/user/profile")
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
     * DELETE /api/user/account
     * 销号：删除用户、历史日志，级联更新战队人数。
     * Request body: {"openid": "..."}
     */
    @DeleteMapping("/user/account")
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
