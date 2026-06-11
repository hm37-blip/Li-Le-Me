-- MySQL schema. Auto-run by spring.sql.init on startup.

CREATE TABLE IF NOT EXISTS squads (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    squad_name    VARCHAR(64)  NOT NULL,
    invite_code   VARCHAR(32)  NOT NULL UNIQUE,
    admin_openid  VARCHAR(128) NOT NULL,
    max_members   INT          DEFAULT 50,
    member_count  INT          DEFAULT 0,
    is_active     BOOLEAN      DEFAULT TRUE,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid              VARCHAR(128) NOT NULL UNIQUE,
    lc_id               VARCHAR(64),
    nickname            VARCHAR(64),
    avatar_url          VARCHAR(512),
    total_solved        INT          DEFAULT 0,
    total_points        INT          DEFAULT 0,
    daily_steps         INT          DEFAULT 0,
    squad_id            BIGINT,
    registration_status INT          DEFAULT 0,
    token               VARCHAR(128),
    last_update         DATETIME,
    created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_logs (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid       VARCHAR(128) NOT NULL,
    log_date     DATE         NOT NULL,
    total_solved INT          DEFAULT 0,
    daily_steps  INT          DEFAULT 0,
    easy_count   INT          DEFAULT 0,
    medium_count INT          DEFAULT 0,
    hard_count   INT          DEFAULT 0,
    daily_points INT          DEFAULT 0,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    rank_tier    VARCHAR(16),
    UNIQUE KEY uk_openid_date (openid, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
