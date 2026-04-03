package com.cesa.li_le_me.controller;

import com.cesa.li_le_me.entity.User;
import com.cesa.li_le_me.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Validated
@RestController
@RequestMapping("/api/user")
public class LeetCodeBindController {

    private static final Pattern LC_USERNAME_PATTERN = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]{1,29}$");

    private final UserRepository userRepository;

    public LeetCodeBindController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/bindlc")
    public ResponseEntity<Map<String, Object>> bindLeetCode(@Valid @RequestBody BindRequest request) {
        if (!LC_USERNAME_PATTERN.matcher(request.getLeetcodeUsername()).matches()) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("LC_bind_success", false);
            fail.put("error_message", "LeetCode用户名格式不正确：需要2-30位，以字母或下划线开头，只能包含字母、数字和下划线");
            return ResponseEntity.ok(fail);
        }

        if (userRepository.findByLeetcodeUsernameIgnoreCase(request.getLeetcodeUsername()).isPresent()) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("LC_bind_success", false);
            fail.put("error_message", "力了么账号已存在");
            return ResponseEntity.ok(fail);
        }

        User user = userRepository.findByOpenid(request.getOpenid())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));

        user.setLeetcodeUsername(request.getLeetcodeUsername());
        user.setRegistrationStatus(1);
        userRepository.save(user);

        Map<String, Object> ok = new HashMap<>();
        ok.put("LC_bind_success", true);
        ok.put("error_message", "");
        return ResponseEntity.ok(ok);
    }

    public static class BindRequest {
        @NotBlank(message = "openid不能为空")
        private String openid;

        @NotBlank(message = "leetcode_username不能为空")
        private String leetcode_username;

        public String getOpenid() {
            return openid;
        }

        public void setOpenid(String openid) {
            this.openid = openid;
        }

        public String getLeetcodeUsername() {
            return leetcode_username;
        }

        public void setLeetcodeUsername(String leetcodeUsername) {
            this.leetcode_username = leetcodeUsername;
        }
    }
}
