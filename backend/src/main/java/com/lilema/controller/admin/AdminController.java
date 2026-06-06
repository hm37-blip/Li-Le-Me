package com.lilema.controller.admin;

import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
<<<<<<< HEAD
import com.lilema.service.AdminService;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
=======
import com.lilema.mapper.SquadRepository;
import com.lilema.mapper.UserRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

<<<<<<< HEAD
=======
import java.util.UUID;

>>>>>>> origin/feat-data-viz-(Andy-Jiang)
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Validated
@RestController
@RequestMapping("/api/admin")
<<<<<<< HEAD
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/squads")
    public ResponseEntity<List<Map<String, Object>>> getAllSquads() {
        List<Squad> squads = adminService.getAllSquads();
=======
public class AdminController {

    private final SquadRepository squadRepository;
    private final UserRepository userRepository;

    public AdminController(SquadRepository squadRepository, UserRepository userRepository) {
        this.squadRepository = squadRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/squads")
    public ResponseEntity<List<Map<String, Object>>> getAllSquads() {
        List<Squad> squads = squadRepository.findAll();
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
        List<Map<String, Object>> result = squads.stream().map(squad -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", squad.getId());
            m.put("squad_name", squad.getSquadName());
            m.put("invite_code", squad.getInviteCode());
            m.put("max_members", squad.getMaxMembers());
            m.put("is_active", squad.getIsActive());
<<<<<<< HEAD
            m.put("member_count", adminService.countMembersBySquadId(squad.getId()));
=======
            m.put("member_count", userRepository.countBySquadId(squad.getId()));
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/squads")
    public ResponseEntity<Map<String, Object>> createSquad(@Valid @RequestBody CreateSquadRequest request) {
<<<<<<< HEAD
        if (adminService.existsSquadByInviteCode(request.getInviteCode())) {
=======
        if (squadRepository.findByInviteCode(request.getInviteCode()).isPresent()) {
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
            Map<String, Object> fail = new HashMap<>();
            fail.put("success", false);
            fail.put("error_message", "邀请码已存在");
            return ResponseEntity.ok(fail);
        }

<<<<<<< HEAD
        Squad squad = adminService.createSquad(request.getSquadName(), request.getInviteCode(), request.getMaxMembers());
=======
        Squad squad = new Squad();
        squad.setSquadName(request.getSquadName());
        squad.setInviteCode(request.getInviteCode());
        squad.setAdminId("admin");
        squad.setMaxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 50);
        squad.setIsActive(true);
        squadRepository.save(squad);
>>>>>>> origin/feat-data-viz-(Andy-Jiang)

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

<<<<<<< HEAD
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
=======
        Squad squad = squadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "战队不存在"));

        // 检查名称唯一性（排除自身）
        squadRepository.findBySquadName(request.getSquadName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "战队名称已存在");
            }
        });

        // 检查邀请码唯一性（排除自身）
        squadRepository.findByInviteCode(request.getInviteCode()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "邀请码已存在");
            }
        });

        squad.setSquadName(request.getSquadName());
        squad.setInviteCode(request.getInviteCode());
        squad.setMaxMembers(request.getMaxMembers());
        squadRepository.save(squad);

        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("squad_name", squad.getSquadName());
        ok.put("invite_code", squad.getInviteCode());
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
        return ResponseEntity.ok(ok);
    }

    @GetMapping("/squads/{id}/members")
    public ResponseEntity<List<Map<String, Object>>> getSquadMembers(@PathVariable Long id) {
<<<<<<< HEAD
        List<User> members = adminService.getMembersBySquadId(id);
=======
        List<User> members = userRepository.findBySquadId(id);
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
        List<Map<String, Object>> result = members.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("nickname", u.getNickname());
<<<<<<< HEAD
            m.put("lc_id", u.getLcId());
=======
            m.put("leetcode_username", u.getLeetcodeUsername());
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
            m.put("openid", u.getOpenid());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/squads/{id}")
    public ResponseEntity<Map<String, Object>> deleteSquad(@PathVariable Long id) {
<<<<<<< HEAD
        if (adminService.getSquadById(id) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "战队不存在");
        }
        adminService.deleteSquad(id);
=======
        if (!squadRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "战队不存在");
        }
        // demote members: clear squad, reset status to 1 (has LC, no squad)
        userRepository.findBySquadId(id).forEach(u -> {
            u.setSquadId(null);
            u.setRegistrationStatus(1);
            userRepository.save(u);
        });
        squadRepository.deleteById(id);
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        return ResponseEntity.ok(ok);
    }

    @DeleteMapping("/squads/{squadId}/members/{userId}")
<<<<<<< HEAD
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable Long squadId,
            @PathVariable Long userId) {

        User user = adminService.getUserById(userId);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在");
        }
=======
    public ResponseEntity<Map<String, Object>> removeMember(@PathVariable Long squadId, @PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));

>>>>>>> origin/feat-data-viz-(Andy-Jiang)
        if (!squadId.equals(user.getSquadId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "该用户不属于此战队");
        }

<<<<<<< HEAD
        adminService.removeMemberFromSquad(userId);
=======
        user.setSquadId(null);
        user.setRegistrationStatus(1);
        userRepository.save(user);
>>>>>>> origin/feat-data-viz-(Andy-Jiang)

        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        return ResponseEntity.ok(ok);
    }

<<<<<<< HEAD
=======
    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createPlayer(@Valid @RequestBody CreatePlayerRequest request) {
        if (userRepository.findByOpenid(request.getOpenid()).isPresent()) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("success", false);
            fail.put("error_message", "该 openid 已存在");
            return ResponseEntity.ok(fail);
        }
        if (userRepository.findByLeetcodeUsernameIgnoreCase(request.getLeetcodeUsername()).isPresent()) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("success", false);
            fail.put("error_message", "该 LeetCode 账号已被绑定");
            return ResponseEntity.ok(fail);
        }

        User user = new User();
        user.setOpenid(request.getOpenid());
        user.setNickname(request.getNickname());
        user.setLeetcodeUsername(request.getLeetcodeUsername());
        user.setRegistrationStatus(1); // has LC, no squad yet — will join via invite code
        user.setToken(UUID.randomUUID().toString());
        userRepository.save(user);

        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("nickname", user.getNickname());
        return ResponseEntity.ok(ok);
    }

    public static class CreatePlayerRequest {
        @JsonProperty("openid")
        @NotBlank(message = "openid 不能为空")
        private String openid;

        @JsonProperty("nickname")
        @NotBlank(message = "昵称不能为空")
        private String nickname;

        @JsonProperty("leetcode_username")
        @NotBlank(message = "LeetCode 用户名不能为空")
        private String leetcodeUsername;

        @JsonProperty("squad_id")
        private Long squadId;

        public String getOpenid() { return openid; }
        public void setOpenid(String v) { this.openid = v; }
        public String getNickname() { return nickname; }
        public void setNickname(String v) { this.nickname = v; }
        public String getLeetcodeUsername() { return leetcodeUsername; }
        public void setLeetcodeUsername(String v) { this.leetcodeUsername = v; }
        public Long getSquadId() { return squadId; }
        public void setSquadId(Long v) { this.squadId = v; }
    }

>>>>>>> origin/feat-data-viz-(Andy-Jiang)
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
