MERGE INTO squads (squad_name, invite_code, admin_id, max_members, is_active, created_at)
KEY (invite_code) VALUES ('测试战队', 'TEST2024', 'admin_001', 50, true, CURRENT_TIMESTAMP);

MERGE INTO squads (squad_name, invite_code, admin_id, max_members, is_active, created_at)
KEY (invite_code) VALUES ('CESA战队', 'CESA666', 'admin_001', 50, true, CURRENT_TIMESTAMP);
