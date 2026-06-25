package com.lilema.common.config;

import com.lilema.common.security.SecurityGateInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 注册 {@link SecurityGateInterceptor}，让生产模式硬开关作用于调试与管理接口。
 */
@Configuration
public class WebSecurityGateConfig implements WebMvcConfigurer {

    private final SecurityGateInterceptor securityGateInterceptor;

    public WebSecurityGateConfig(SecurityGateInterceptor securityGateInterceptor) {
        this.securityGateInterceptor = securityGateInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(securityGateInterceptor)
                .addPathPatterns("/debug/**", "/api/admin/**");
    }
}
