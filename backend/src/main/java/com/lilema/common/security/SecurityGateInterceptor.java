package com.lilema.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilema.common.config.AppMode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.HashMap;
import java.util.Map;

/**
 * 生产模式下守护 {@code /debug/*} 与 {@code /api/admin/*}。dev 模式直接放行。
 * 由 {@link AppMode} 决定行为，{@link com.lilema.common.config.WebSecurityGateConfig} 负责注册。
 */
@Component
public class SecurityGateInterceptor implements HandlerInterceptor {

    private final AppMode appMode;
    private final ObjectMapper objectMapper;

    public SecurityGateInterceptor(AppMode appMode, ObjectMapper objectMapper) {
        this.appMode = appMode;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 开发模式：全部放行（本地开发 / 微信开发者工具）。
        if (appMode.isDevMode()) {
            return true;
        }

        String path = request.getRequestURI();

        // 调试接口仅限开发，生产一律禁用。
        if (path.startsWith("/debug")) {
            return deny(response, HttpStatus.FORBIDDEN, "调试接口在生产模式下不可用");
        }

        // 管理接口需携带有效的管理员令牌。
        if (path.startsWith("/api/admin")) {
            String provided = request.getHeader("X-Admin-Token");
            if (!appMode.adminTokenMatches(provided)) {
                return deny(response, HttpStatus.FORBIDDEN, "需要有效的管理员令牌 (X-Admin-Token)");
            }
        }

        return true;
    }

    private boolean deny(HttpServletResponse response, HttpStatus status, String message) throws Exception {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("error", message);
        body.put("status", status.value());
        response.getWriter().write(objectMapper.writeValueAsString(body));
        return false;
    }
}
