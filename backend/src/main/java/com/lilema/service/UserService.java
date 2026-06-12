package com.lilema.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.lilema.dto.LcUserStats;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    @Value("${wechat.appid}")
    private String appid;

    @Value("${wechat.secret}")
    private String secret;

    @Value("${wechat.mock-openid:}")
    private String mockOpenid;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final UserMapper userMapper;
    private final DailyLogMapper dailyLogMapper;
    private final SquadMapper squadMapper;
    private final LcEngineService lcEngineService;
    private final AuthTokenService authTokenService;

    public Map<String, Object> wechatLogin(String jsCode) {
        return wechatLogin(jsCode, null);
    }

    /**
     * Exchange a WeChat js_code for an openid and return the frontend login contract.
     *
     * @param jsCode            the temporary code from wx.login()
     * @param devOpenidOverride optional local-dev openid, used for simulator accounts
     */
    public Map<String, Object> wechatLogin(String jsCode, String devOpenidOverride) {
        String openid;
        if (devOpenidOverride != null && !devOpenidOverride.isBlank()) {
            openid = devOpenidOverride;
            log.warn("[DEV] Using request mock openid: {}", openid);
        } else if (mockOpenid != null && !mockOpenid.isBlank()) {
            // 本地开发 mock 模式，跳过真实微信接口
            openid = mockOpenid;
            log.warn("[DEV] Using mock openid: {}", openid);
        } else {
            if (jsCode == null || jsCode.isBlank()) {
                throw new RuntimeException("js_code is required");
            }
            String url = String.format(
                    "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                    appid, secret, jsCode);

            String responseBody = restTemplate.getForObject(url, String.class);
            log.debug("WeChat jscode2session response: {}", responseBody);

            try {
                JsonNode root = objectMapper.readTree(responseBody);
                if (root.has("errcode") && root.path("errcode").asInt() != 0) {
                    String errMsg = root.path("errmsg").asText("unknown error");
                    throw new RuntimeException("WeChat login failed: " + errMsg);
                }
                openid = root.path("openid").asText();
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse WeChat session response", e);
            }

            if (openid == null || openid.isBlank()) {
                throw new RuntimeException("WeChat login did not return a valid openid");
            }
        }

        // Check whether user already exists
        User existing = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid));
        boolean isNew = existing == null;
        User user = existing;
        if (isNew) {
            user = new User();
            user.setOpenid(openid);
            user.setTotalSolved(0);
            user.setTotalPoints(0);
            user.setDailySteps(0);
            user.setRegistrationStatus(0);
            user.setCreatedAt(LocalDateTime.now());
            userMapper.insert(user);
            log.info("New user registered: {}", openid);
        } else {
            log.debug("Existing user logged in: {}", openid);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("openid", user.getOpenid());
        result.put("is_new_user", isNew);
        result.putAll(authTokenService.issueTokens(user));
        result.put("registration_status", user.getRegistrationStatus());
        if (!isNew) {
            result.put("user_info", buildUserInfo(user));
        }
        return result;
    }

    /**
     * Refresh the current auth token.
     */
    public Map<String, Object> refreshToken(String refreshToken) {
        return authTokenService.refreshTokens(refreshToken);
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

    /**
     * Bind a LeetCode username to a user account.
     * Validates that the LC username exists before saving.
     *
     * @param openid     the user's WeChat openid
     * @param lcUsername the LeetCode username to bind
     */
    public void bindLeetCode(String openid, String lcUsername) {
        // Validate the LC account exists (fetchStats will throw on failure)
        try {
            LcUserStats stats = lcEngineService.fetchStats(lcUsername);
            log.info("LC account validated for binding: {} → {}", openid, lcUsername);
        } catch (Exception e) {
            throw new RuntimeException("LeetCode account validation failed: " + e.getMessage(), e);
        }

        UpdateWrapper<User> uw = new UpdateWrapper<>();
        uw.eq("openid", openid).set("lc_id", lcUsername);
        int updated = userMapper.update(null, uw);

        if (updated == 0) {
            throw new RuntimeException("User not found for openid: " + openid);
        }
        log.info("LeetCode bound: openid={}, lcId={}", openid, lcUsername);
    }

    /**
     * Update the user's display profile (nickname and/or avatar).
     *
     * @param openid    the user's WeChat openid
     * @param nickname  new display name (may be null to leave unchanged)
     * @param avatarUrl new avatar URL (may be null to leave unchanged)
     */
    public void updateUserProfile(String openid, String nickname, String avatarUrl) {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid));
        if (user == null) {
            throw new RuntimeException("User not found: " + openid);
        }

        UpdateWrapper<User> uw = new UpdateWrapper<>();
        uw.eq("openid", openid);

        if (nickname != null && !nickname.isBlank()) {
            uw.set("nickname", nickname);
        }
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            uw.set("avatar_url", avatarUrl);
        }

        userMapper.update(null, uw);
        log.debug("Profile updated for: {}", openid);
    }

    /**
     * 销号：删除用户及其所有数据，级联处理战队人数。
     * README 要求在同一事务中完成：
     *   ① 删除 daily_logs 历史记录
     *   ② 战队 member_count - 1
     *   ③ 若 member_count 降至 0，标记战队 is_active = false
     *   ④ 删除 users 记录
     */
    @Transactional
    public void deleteAccount(String openid) {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid));
        if (user == null) {
            throw new RuntimeException("User not found: " + openid);
        }

        // ① 删除历史日志
        dailyLogMapper.delete(new QueryWrapper<DailyLog>().eq("openid", openid));
        authTokenService.revokeRefreshToken(openid);

        // ② 更新战队人数
        if (user.getSquadId() != null) {
            squadMapper.update(null, new UpdateWrapper<Squad>()
                    .eq("id", user.getSquadId())
                    .setSql("member_count = member_count - 1"));

            // ③ 若人数归零则关闭战队
            squadMapper.update(null, new UpdateWrapper<Squad>()
                    .eq("id", user.getSquadId())
                    .eq("member_count", 0)
                    .set("is_active", false));
        }

        // ④ 删除用户
        userMapper.deleteById(user.getId());
        log.info("Account deleted: {}", openid);
    }
}
