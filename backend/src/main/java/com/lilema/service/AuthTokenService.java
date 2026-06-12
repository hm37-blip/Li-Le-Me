package com.lilema.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilema.entity.po.User;
import com.lilema.entity.po.UserRefreshToken;
import com.lilema.mapper.UserMapper;
import com.lilema.mapper.UserRefreshTokenMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthTokenService {

    @Value("${auth.jwt-secret:li-le-me-dev-secret-change-me}")
    private String jwtSecret;

    @Value("${auth.access-token-expires-in:7200}")
    private long accessTokenExpiresInSeconds;

    @Value("${auth.refresh-token-expires-in:2592000}")
    private long refreshTokenExpiresInSeconds;

    private final ObjectMapper objectMapper;
    private final UserMapper userMapper;
    private final UserRefreshTokenMapper refreshTokenMapper;

    @Transactional
    public Map<String, Object> issueTokens(User user) {
        String accessToken = createAccessToken(user.getOpenid());
        String refreshToken = createRefreshToken();
        LocalDateTime now = LocalDateTime.now();

        UserRefreshToken existing = refreshTokenMapper.selectOne(new QueryWrapper<UserRefreshToken>()
                .eq("openid", user.getOpenid())
                .last("LIMIT 1"));

        if (existing == null) {
            UserRefreshToken row = new UserRefreshToken();
            row.setOpenid(user.getOpenid());
            row.setRefreshToken(refreshToken);
            row.setExpiresAt(now.plusSeconds(refreshTokenExpiresInSeconds));
            row.setCreatedAt(now);
            row.setUpdatedAt(now);
            refreshTokenMapper.insert(row);
        } else {
            refreshTokenMapper.update(null, new UpdateWrapper<UserRefreshToken>()
                    .eq("id", existing.getId())
                    .set("refresh_token", refreshToken)
                    .set("expires_at", now.plusSeconds(refreshTokenExpiresInSeconds))
                    .set("updated_at", now));
        }

        return tokenResponse(accessToken, refreshToken);
    }

    @Transactional
    public Map<String, Object> refreshTokens(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("refreshToken is required");
        }

        UserRefreshToken stored = refreshTokenMapper.selectOne(new QueryWrapper<UserRefreshToken>()
                .eq("refresh_token", refreshToken)
                .last("LIMIT 1"));
        if (stored == null || stored.getExpiresAt() == null || stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid refreshToken");
        }

        User user = userMapper.selectOne(new QueryWrapper<User>()
                .eq("openid", stored.getOpenid())
                .last("LIMIT 1"));
        if (user == null) {
            throw new IllegalArgumentException("Invalid refreshToken");
        }

        return issueTokens(user);
    }

    public User findUserByAccessToken(String accessToken) {
        String openid = validateAccessToken(accessToken);
        if (openid == null) {
            return null;
        }
        return userMapper.selectOne(new QueryWrapper<User>()
                .eq("openid", openid)
                .last("LIMIT 1"));
    }

    public void revokeRefreshToken(String openid) {
        refreshTokenMapper.delete(new QueryWrapper<UserRefreshToken>().eq("openid", openid));
    }

    private Map<String, Object> tokenResponse(String accessToken, String refreshToken) {
        Map<String, Object> result = new HashMap<>();
        result.put("token", accessToken);
        result.put("refreshToken", refreshToken);
        result.put("expiresIn", accessTokenExpiresInSeconds);
        return result;
    }

    private String createAccessToken(String openid) {
        long now = System.currentTimeMillis() / 1000;

        Map<String, Object> header = new HashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new HashMap<>();
        payload.put("sub", openid);
        payload.put("token_type", "access");
        payload.put("iat", now);
        payload.put("exp", now + accessTokenExpiresInSeconds);
        payload.put("jti", UUID.randomUUID().toString());

        String encodedHeader = base64UrlJson(header);
        String encodedPayload = base64UrlJson(payload);
        String unsignedToken = encodedHeader + "." + encodedPayload;
        return unsignedToken + "." + sign(unsignedToken);
    }

    private String validateAccessToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }

        String unsignedToken = parts[0] + "." + parts[1];
        if (!MessageDigest.isEqual(sign(unsignedToken).getBytes(StandardCharsets.UTF_8),
                parts[2].getBytes(StandardCharsets.UTF_8))) {
            return null;
        }

        try {
            JsonNode payload = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
            if (!"access".equals(payload.path("token_type").asText())) {
                return null;
            }
            if (payload.path("exp").asLong(0) <= System.currentTimeMillis() / 1000) {
                return null;
            }
            return payload.path("sub").asText(null);
        } catch (Exception e) {
            return null;
        }
    }

    private String createRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private String base64UrlJson(Map<String, Object> value) {
        try {
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encode JWT", e);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign JWT", e);
        }
    }
}
