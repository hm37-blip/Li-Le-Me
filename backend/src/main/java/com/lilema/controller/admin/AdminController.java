package com.lilema.controller.admin;

import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * master 前端契约的管理后台,委托 dev 的 AdminService(MyBatis-Plus)。
 * 响应均为扁平 JSON(member_count 用 COUNT(users) 实时计算)。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/squads")
    public ResponseEntity<List<Map<String, Object>>> getAllSquads() {
        List<Map<String, Object>> result = adminService.getAllSquads().stream().map(squad -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", squad.getId());
            m.put("squad_name", squad.getSquadName());
            m.put("invite_code", squad.getInviteCode());
            m.put("max_members", squad.getMaxMembers());
            m.put("is_active", squad.getIsActive());
            m.put("member_count", adminService.countMembersBySquadId(squad.getId()));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/squads")
    public ResponseEntity<Map<String, Object>> createSquad(@RequestBody Map<String, Object> body) {
        String squadName = str(body.get("squad_name"));
        String inviteCode = str(body.get("invite_code"));
        Integer maxMembers = intOrNull(body.get("max_members"));

        if (squadName == null || squadName.isBlank() || inviteCode == null || inviteCode.isBlank()) {
            return ResponseEntity.ok(fail("战队名称和邀请码不能为空"));
        }
        if (adminService.existsSquadByInviteCode(inviteCode)) {
            return ResponseEntity.ok(fail("邀请码已存在"));
        }
        Squad squad = adminService.createSquad(squadName, inviteCode, maxMembers);
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("squad_name", squad.getSquadName());
        ok.put("invite_code", squad.getInviteCode());
        return ResponseEntity.ok(ok);
    }

    @PutMapping("/squads/{id}")
    public ResponseEntity<Map<String, Object>> updateSquad(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String squadName = str(body.get("squad_name"));
        String inviteCode = str(body.get("invite_code"));
        Integer maxMembers = intOrNull(body.get("max_members"));

        Squad existing = adminService.getSquadById(id);
        if (existing == null) {
            return ResponseEntity.ok(fail("战队不存在"));
        }
        Squad byName = adminService.getAllSquads().stream()
                .filter(s -> s.getSquadName().equals(squadName) && !s.getId().equals(id)).findFirst().orElse(null);
        if (byName != null) {
            return ResponseEntity.ok(fail("战队名称已存在"));
        }
        Squad byCode = adminService.getAllSquads().stream()
                .filter(s -> s.getInviteCode().equals(inviteCode) && !s.getId().equals(id)).findFirst().orElse(null);
        if (byCode != null) {
            return ResponseEntity.ok(fail("邀请码已存在"));
        }

        Squad squad = adminService.updateSquad(id, squadName, inviteCode, maxMembers);
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("squad_name", squad.getSquadName());
        ok.put("invite_code", squad.getInviteCode());
        return ResponseEntity.ok(ok);
    }

    @GetMapping("/squads/{id}/members")
    public ResponseEntity<List<Map<String, Object>>> getSquadMembers(@PathVariable Long id) {
        List<Map<String, Object>> result = adminService.getMembersBySquadId(id).stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("nickname", u.getNickname());
            m.put("leetcode_username", u.getLcId());
            m.put("openid", u.getOpenid());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/squads/{id}")
    public ResponseEntity<Map<String, Object>> deleteSquad(@PathVariable Long id) {
        if (adminService.getSquadById(id) == null) {
            return ResponseEntity.ok(fail("战队不存在"));
        }
        adminService.deleteSquad(id);
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        return ResponseEntity.ok(ok);
    }

    @DeleteMapping("/squads/{squadId}/members/{userId}")
    public ResponseEntity<Map<String, Object>> removeMember(@PathVariable Long squadId, @PathVariable Long userId) {
        User user = adminService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.ok(fail("用户不存在"));
        }
        if (!squadId.equals(user.getSquadId())) {
            return ResponseEntity.ok(fail("该用户不属于此战队"));
        }
        adminService.removeMemberFromSquad(userId);
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        return ResponseEntity.ok(ok);
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private static Integer intOrNull(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).intValue();
        try {
            return Integer.parseInt(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, Object> fail(String msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", false);
        m.put("error_message", msg);
        return m;
    }
}
