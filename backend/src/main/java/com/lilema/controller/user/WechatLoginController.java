package com.lilema.controller.user;

import com.lilema.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * master 前端契约的微信登录接口。
 * 真实模式:通过 UserService 调用微信 jscode2session。
 * dev 模式:可传 device_id 生成稳定 mock openid,用于微信开发者工具多账号调试。
 */
@RestController
@RequestMapping("/api/v1/user")
public class WechatLoginController {

    private final UserService userService;

    public WechatLoginController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String jsCode = body.get("js_code");
        String deviceId = body.get("device_id");

        String devOpenid = null;
        if (deviceId != null && !deviceId.isBlank()) {
            devOpenid = "mock_" + deviceId;
        }

        try {
            return ResponseEntity.ok(userService.wechatLogin(jsCode, devOpenid));
        } catch (RuntimeException e) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("error_message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }
}
