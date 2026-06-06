-- Seed squads (idempotent via MERGE on the unique invite_code).
MERGE INTO squads (squad_name, invite_code, admin_openid, max_members, member_count, is_active, created_at)
KEY (invite_code) VALUES ('测试战队', 'TEST2024', 'admin_001', 50, 0, TRUE, CURRENT_TIMESTAMP);

MERGE INTO squads (squad_name, invite_code, admin_openid, max_members, member_count, is_active, created_at)
KEY (invite_code) VALUES ('CESA战队', 'CESA666', 'admin_001', 50, 0, TRUE, CURRENT_TIMESTAMP);
