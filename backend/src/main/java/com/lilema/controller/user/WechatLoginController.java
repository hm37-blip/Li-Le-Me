package com.lilema.controller.user;

<<<<<<< HEAD
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
=======
import com.lilema.entity.po.User;
import com.lilema.mapper.UserRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/wechat")
public class WechatLoginController {

    private final UserRepository userRepository;

    @Value("${wechat.mock-mode:true}")
    private boolean mockMode;

    public WechatLoginController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        String openid;
        if (mockMode) {
            String deviceId = request.getDeviceId();
            if (deviceId != null && !deviceId.isBlank()) {
                openid = "mock_" + deviceId;
            } else {
                openid = "mock_" + request.getJsCode().hashCode();
            }
        } else {
            // TODO: 调用微信 jscode2session API 获取真实 openid
            openid = "mock_" + request.getJsCode().hashCode();
        }

        Optional<User> existing = userRepository.findByOpenid(openid);

        User user;
        boolean isNew = existing.isEmpty();
        if (isNew) {
            user = new User();
            user.setOpenid(openid);
            user.setRegistrationStatus(0);
            user.setToken(UUID.randomUUID().toString());
            userRepository.save(user);
        } else {
            user = existing.get();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("openid", user.getOpenid());
        response.put("is_new_user", isNew);
        response.put("token", user.getToken());
        response.put("registration_status", user.getRegistrationStatus());

        if (!isNew) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("nickname", user.getNickname());
            userInfo.put("leetcode_username", user.getLeetcodeUsername());
            userInfo.put("avatar_file_id", user.getAvatarFileId());
            userInfo.put("squad_id", user.getSquadId());
            response.put("user_info", userInfo);
        }

        return ResponseEntity.ok(response);
    }

    public static class LoginRequest {
        @JsonProperty("js_code")
        @NotBlank(message = "js_code不能为空")
        private String js_code;

        @JsonProperty("device_id")
        private String device_id;

        public String getJsCode() {
            return js_code;
        }

        public void setJsCode(String jsCode) {
            this.js_code = jsCode;
        }

        public String getDeviceId() {
            return device_id;
        }

        public void setDeviceId(String deviceId) {
            this.device_id = deviceId;
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
        }
    }
}
