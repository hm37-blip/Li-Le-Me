package com.lilema.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import com.lilema.service.AuthTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * master 前端契约:绑定 LeetCode、查询登录态、查询战队成员。
 * 鉴权:Authorization: Bearer <token>(/status, /squad-members)。
 */
@RestController
@RequestMapping("/api/v1/user")
public class LeetCodeBindController {

    private static final Pattern LC_USERNAME_PATTERN = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]{2,29}$");

    private final UserMapper userMapper;
    private final SquadMapper squadMapper;
    private final AuthTokenService authTokenService;

    public LeetCodeBindController(UserMapper userMapper, SquadMapper squadMapper, AuthTokenService authTokenService) {
        this.userMapper = userMapper;
        this.squadMapper = squadMapper;
        this.authTokenService = authTokenService;
    }

    @PostMapping("/bind")
    public ResponseEntity<Map<String, Object>> bindLeetCode(@RequestBody Map<String, String> body) {
        String openid = body.get("openid");
        String lc = body.get("leetcode_username");

        if (lc == null || !LC_USERNAME_PATTERN.matcher(lc).matches()) {
            return ResponseEntity.ok(fail("LeetCode用户名格式不正确：需要3-30位，以字母或下划线开头，只能包含字母、数字和下划线"));
        }

        User dup = userMapper.selectOne(new QueryWrapper<User>().eq("lc_id", lc).last("LIMIT 1"));
        if (dup != null && !dup.getOpenid().equals(openid)) {
            return ResponseEntity.ok(fail("该 LeetCode 账号已被绑定"));
        }

        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(fail("用户不存在"));
        }

        userMapper.update(null, new UpdateWrapper<User>().eq("openid", openid)
                .set("lc_id", lc)
                .set("registration_status", 1));

        Map<String, Object> ok = new HashMap<>();
        ok.put("LC_bind_success", true);
        ok.put("error_msg", "");
        return ResponseEntity.ok(ok);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = userByToken(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("registration_status", user.getRegistrationStatus());
        resp.put("user_info", buildUserInfo(user));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/squad-members")
    public ResponseEntity<?> squadMembers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = userByToken(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (user.getSquadId() == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<Map<String, Object>> members = userMapper.selectBySquadId(user.getSquadId()).stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("nickname", u.getNickname());
            m.put("leetcode_username", u.getLcId());
            m.put("avatar_file_id", u.getAvatarUrl());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(members);
    }

    private User userByToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        if (token.isBlank()) {
            return null;
        }
        return authTokenService.findUserByAccessToken(token);
    }

    private Map<String, Object> buildUserInfo(User user) {
        Map<String, Object> info = new HashMap<>();
        info.put("nickname", user.getNickname());
        info.put("leetcode_username", user.getLcId());
        info.put("avatar_file_id", user.getAvatarUrl());
        info.put("squad_id", user.getSquadId());
        if (user.getSquadId() != null) {
            Squad squad = squadMapper.selectById(user.getSquadId());
            if (squad != null) {
                info.put("squad_name", squad.getSquadName());
            }
        }
        return info;
    }

    private Map<String, Object> fail(String msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("LC_bind_success", false);
        m.put("error_msg", msg);
        return m;
    }
}
