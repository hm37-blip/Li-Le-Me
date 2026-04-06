package com.cesa.li_le_me.controller;

import com.cesa.li_le_me.entity.User;
import com.cesa.li_le_me.repository.UserRepository;
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
        }
    }
}
