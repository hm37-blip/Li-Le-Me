package com.cesa.lilema.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.cesa.lilema.dto.LcUserStats;
import com.cesa.lilema.entity.User;
import com.cesa.lilema.mapper.UserMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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
    private final LcEngineService lcEngineService;

    /**
     * Exchange a WeChat js_code for an openid and return login status.
     *
     * @param jsCode the temporary code from wx.login()
     * @return a map containing "openid" and "registration_status" ("new" or "existing")
     */
    public Map<String, Object> wechatLogin(String jsCode) {
        String openid;
        if (mockOpenid != null && !mockOpenid.isBlank()) {
            // 本地开发 mock 模式，跳过真实微信接口
            openid = mockOpenid;
            log.warn("[DEV] Using mock openid: {}", openid);
        } else {
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
        String registrationStatus;
        if (existing == null) {
            User newUser = new User();
            newUser.setOpenid(openid);
            newUser.setTotalSolved(0);
            newUser.setTotalPoints(0);
            newUser.setDailySteps(0);
            newUser.setCreatedAt(LocalDateTime.now());
            userMapper.insert(newUser);
            registrationStatus = "new";
            log.info("New user registered: {}", openid);
        } else {
            registrationStatus = "existing";
            log.debug("Existing user logged in: {}", openid);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("openid", openid);
        result.put("registration_status", registrationStatus);
        return result;
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
}
