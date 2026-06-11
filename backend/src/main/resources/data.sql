-- Seed squads (idempotent via invite_code unique key).
INSERT INTO squads (squad_name, invite_code, admin_openid, max_members, member_count, is_active, created_at)
VALUES ('测试战队', 'TEST2024', 'admin_001', 50, 0, TRUE, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    squad_name = VALUES(squad_name),
    admin_openid = VALUES(admin_openid),
    max_members = VALUES(max_members),
    is_active = VALUES(is_active);

INSERT INTO squads (squad_name, invite_code, admin_openid, max_members, member_count, is_active, created_at)
VALUES ('CESA战队', 'CESA666', 'admin_001', 50, 0, TRUE, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    squad_name = VALUES(squad_name),
    admin_openid = VALUES(admin_openid),
    max_members = VALUES(max_members),
    is_active = VALUES(is_active);
