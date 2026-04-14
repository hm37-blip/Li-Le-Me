package com.lilema.controller.admin;

import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.service.AdminService;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Validated
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/squads")
    public ResponseEntity<List<Map<String, Object>>> getAllSquads() {
        List<Squad> squads = adminService.getAllSquads();
        List<Map<String, Object>> result = squads.stream().map(squad -> {
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
    public ResponseEntity<Map<String, Object>> createSquad(@Valid @RequestBody CreateSquadRequest request) {
        if (adminService.existsSquadByInviteCode(request.getInviteCode())) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("success", false);
            fail.put("error_message", "邀请码已存在");
            return ResponseEntity.ok(fail);
        }

        Squad squad = adminService.createSquad(request.getSquadName(), request.getInviteCode(), request.getMaxMembers());

        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("squad_name", squad.getSquadName());
        ok.put("invite_code", squad.getInviteCode());
        return ResponseEntity.ok(ok);
    }

    @PutMapping("/squads/{id}")
    public ResponseEntity<Map<String, Object>> updateSquad(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSquadRequest request) {

        Squad existing = adminService.getSquadById(id);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "战队不存在");
        }

        // Check name uniqueness (exclude self)
        if (!existing.getSquadName().equals(request.getSquadName())
                && adminService.existsSquadByName(request.getSquadName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "战队名称已存在");
        }

        // Check invite code uniqueness (exclude self)
        if (!existing.getInviteCode().equals(request.getInviteCode())
                && adminService.existsSquadByInviteCode(request.getInviteCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "邀请码已存在");
        }

        Squad updated = adminService.updateSquad(id, request.getSquadName(), request.getInviteCode(), request.getMaxMembers());

        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("squad_name", updated.getSquadName());
        ok.put("invite_code", updated.getInviteCode());
        return ResponseEntity.ok(ok);
    }

    @GetMapping("/squads/{id}/members")
    public ResponseEntity<List<Map<String, Object>>> getSquadMembers(@PathVariable Long id) {
        List<User> members = adminService.getMembersBySquadId(id);
        List<Map<String, Object>> result = members.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("nickname", u.getNickname());
            m.put("lc_id", u.getLcId());
            m.put("openid", u.getOpenid());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/squads/{id}")
    public ResponseEntity<Map<String, Object>> deleteSquad(@PathVariable Long id) {
        if (adminService.getSquadById(id) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "战队不存在");
        }
        adminService.deleteSquad(id);
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        return ResponseEntity.ok(ok);
    }

    @DeleteMapping("/squads/{squadId}/members/{userId}")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable Long squadId,
            @PathVariable Long userId) {

        User user = adminService.getUserById(userId);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在");
        }
        if (!squadId.equals(user.getSquadId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "该用户不属于此战队");
        }

        adminService.removeMemberFromSquad(userId);

        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        return ResponseEntity.ok(ok);
    }

    public static class CreateSquadRequest {
        @JsonProperty("squad_name")
        @NotBlank(message = "战队名称不能为空")
        private String squadName;

        @JsonProperty("invite_code")
        @NotBlank(message = "邀请码不能为空")
        private String inviteCode;

        @JsonProperty("max_members")
        private Integer maxMembers;

        public String getSquadName() { return squadName; }
        public void setSquadName(String v) { this.squadName = v; }
        public String getInviteCode() { return inviteCode; }
        public void setInviteCode(String v) { this.inviteCode = v; }
        public Integer getMaxMembers() { return maxMembers; }
        public void setMaxMembers(Integer v) { this.maxMembers = v; }
    }

    public static class UpdateSquadRequest {
        @JsonProperty("squad_name")
        @NotBlank(message = "战队名称不能为空")
        private String squadName;

        @JsonProperty("invite_code")
        @NotBlank(message = "邀请码不能为空")
        private String inviteCode;

        @JsonProperty("max_members")
        private Integer maxMembers;

        public String getSquadName() { return squadName; }
        public void setSquadName(String v) { this.squadName = v; }
        public String getInviteCode() { return inviteCode; }
        public void setInviteCode(String v) { this.inviteCode = v; }
        public Integer getMaxMembers() { return maxMembers; }
        public void setMaxMembers(Integer v) { this.maxMembers = v; }
    }
}
