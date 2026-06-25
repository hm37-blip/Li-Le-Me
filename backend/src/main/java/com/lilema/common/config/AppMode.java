package com.lilema.common.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 全局开发/生产硬开关。
 *
 * <p>{@code app.dev-mode=true}（默认，本地开发/模拟器）：放开所有调试与管理接口、允许 mock 登录。
 * {@code app.dev-mode=false}（生产）：
 * <ul>
 *   <li>{@code /debug/*} 全部禁用；</li>
 *   <li>{@code /api/admin/*} 必须携带匹配 {@code app.admin-token} 的 {@code X-Admin-Token} 头；</li>
 *   <li>禁用 mock 登录（device_id / wechat.mock-openid），强制走真实微信 jscode2session。</li>
 * </ul>
 * 通过环境变量 {@code APP_DEV_MODE} / {@code ADMIN_TOKEN} 切换，重启生效。
 */
@Slf4j
@Component
public class AppMode {

    @Value("${app.dev-mode:true}")
    private boolean devMode;

    @Value("${app.admin-token:}")
    private String adminToken;

    public boolean isDevMode() {
        return devMode;
    }

    public boolean isProd() {
        return !devMode;
    }

    /** 生产模式下校验管理员令牌：令牌未配置则一律拒绝（fail-closed）。 */
    public boolean adminTokenMatches(String provided) {
        return adminToken != null && !adminToken.isBlank()
                && provided != null && adminToken.equals(provided);
    }

    @PostConstruct
    void banner() {
        if (devMode) {
            log.warn("==================== APP IN DEV MODE (app.dev-mode=true) ====================");
            log.warn("  /debug/* 开放 · /api/admin/* 无鉴权 · mock 登录启用 —— 仅限本地开发！");
            log.warn("  生产部署请设置 APP_DEV_MODE=false 且 ADMIN_TOKEN=<强随机值>");
            log.warn("============================================================================");
        } else {
            log.info("App in PRODUCTION mode (app.dev-mode=false): /debug/* disabled, "
                    + "/api/admin/* requires X-Admin-Token, mock login disabled.");
            if (adminToken == null || adminToken.isBlank()) {
                log.warn("app.admin-token 为空 → 生产模式下所有 /api/admin/* 请求都将被拒绝 (fail-closed)。");
            }
        }
    }
}
