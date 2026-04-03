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
            openid = "mock_" + request.getJsCode().hashCode();
        } else {
            openid = "mock_" + request.getJsCode().hashCode();
        }

        Optional<User> existing = userRepository.findByOpenid(openid);

        if (existing.isEmpty()) {
            Map<String, Object> notFound = new HashMap<>();
            notFound.put("openid", openid);
            notFound.put("registration_status", -1);
            notFound.put("is_new_user", true);
            notFound.put("token", "");
            return ResponseEntity.ok(notFound);
        }

        User user = existing.get();
        Map<String, Object> response = new HashMap<>();
        response.put("openid", user.getOpenid());
        response.put("is_new_user", false);
        response.put("token", user.getToken());
        response.put("registration_status", user.getRegistrationStatus());

        return ResponseEntity.ok(response);
    }

    public static class LoginRequest {
        @JsonProperty("js_code")
        @NotBlank(message = "js_code不能为空")
        private String js_code;

        public String getJsCode() {
            return js_code;
        }

        public void setJsCode(String jsCode) {
            this.js_code = jsCode;
        }
    }
}
