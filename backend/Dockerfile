# syntax=docker/dockerfile:1
# Li-Le-Me backend - 微信云托管部署镜像 (Spring Boot 3.2.4 / Java 21)
# 多阶段构建: 构建阶段用 Maven 镜像编译出 jar, 运行阶段只带 JRE, 镜像更小。

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# 用阿里云镜像源加速依赖下载 (云托管构建在腾讯云内网, 国内源更稳更快)
COPY maven-settings.xml /root/.m2/settings.xml

# 先拉依赖, 利用 Docker 层缓存 (pom 不变时跳过重新下载)
COPY pom.xml .
RUN mvn -B -s /root/.m2/settings.xml dependency:go-offline

# 再编译打包 (跳过测试, 上线构建不跑单测)
COPY src ./src
RUN mvn -B -s /root/.m2/settings.xml clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# 微信登录需要后端访问 https://api.weixin.qq.com/sns/jscode2session。
# 同时刷新系统 CA 与 Java truststore，确保 JVM TLS 校验能识别微信 HTTPS 证书链。
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ca-certificates-java \
    && update-ca-certificates -f \
    && rm -rf /var/lib/apt/lists/*

# 应用内部用 Asia/Shanghai, 容器时区对齐 (定时任务/日志时间正确)
ENV TZ=Asia/Shanghai
ENV JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts -Djavax.net.ssl.trustStorePassword=changeit"

# 拷贝构建产物 (spring-boot-maven-plugin 产出的可执行 fat jar)
COPY --from=build /build/target/li-le-me-*.jar app.jar

# 服务监听端口 (与 application.yml 的 server.port 默认值一致; 云托管"监听端口"填 8080)
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
