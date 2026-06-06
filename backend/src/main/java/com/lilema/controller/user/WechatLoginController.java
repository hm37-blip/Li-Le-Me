package com.lilema.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * master 前端契约的微信登录接口,跑在 dev 的 MyBatis-Plus 数据层上。
 * mock 模式:openid = "mock_" + device_id(稳定标识同一虚拟账号)。
 */
@RestController
@RequestMapping("/api/wechat")
public class WechatLoginController {

    private final UserMapper userMapper;
    private final SquadMapper squadMapper;

    public WechatLoginController(UserMapper userMapper, SquadMapper squadMapper) {
        this.userMapper = userMapper;
        this.squadMapper = squadMapper;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String jsCode = body.get("js_code");
        String deviceId = body.get("device_id");

        String openid;
        if (deviceId != null && !deviceId.isBlank()) {
            openid = "mock_" + deviceId;
        } else {
            openid = "mock_" + (jsCode == null ? "anon" : Integer.toString(jsCode.hashCode()));
        }

        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
        boolean isNew = (user == null);
        if (isNew) {
            user = new User();
            user.setOpenid(openid);
            user.setTotalSolved(0);
            user.setTotalPoints(0);
            user.setDailySteps(0);
            user.setRegistrationStatus(0);
            user.setToken(UUID.randomUUID().toString());
            user.setCreatedAt(LocalDateTime.now());
            userMapper.insert(user);
        } else if (user.getToken() == null || user.getToken().isBlank()) {
            String token = UUID.randomUUID().toString();
            userMapper.update(null, new UpdateWrapper<User>().eq("openid", openid).set("token", token));
            user.setToken(token);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("openid", user.getOpenid());
        resp.put("is_new_user", isNew);
        resp.put("token", user.getToken());
        resp.put("registration_status", user.getRegistrationStatus());
        if (!isNew) {
            resp.put("user_info", buildUserInfo(user));
        }
        return ResponseEntity.ok(resp);
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
}
