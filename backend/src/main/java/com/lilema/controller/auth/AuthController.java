package com.lilema.controller.auth;

import com.lilema.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    /**
     * Refresh bearer token.
     * Request body: {"refreshToken": "..."}
     * Response body follows the frontend auth.js contract directly:
     * {"token": "...", "refreshToken": "...", "expiresIn": 7200}
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");

        try {
            return ResponseEntity.ok(userService.refreshToken(refreshToken));
        } catch (IllegalArgumentException e) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resp);
        }
    }
}
