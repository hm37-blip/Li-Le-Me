package com.cesa.li_le_me.controller;

import com.cesa.li_le_me.entity.Squad;
import com.cesa.li_le_me.repository.SquadRepository;
import com.cesa.li_le_me.repository.UserRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Validated
@RestController
@RequestMapping("/api/admin")
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
        List<Map<String, Object>> result = squads.stream().map(squad -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", squad.getId());
            m.put("squad_name", squad.getSquadName());
            m.put("invite_code", squad.getInviteCode());
            m.put("max_members", squad.getMaxMembers());
            m.put("is_active", squad.getIsActive());
            m.put("member_count", userRepository.countBySquadId(squad.getId()));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/squads")
    public ResponseEntity<Map<String, Object>> createSquad(@Valid @RequestBody CreateSquadRequest request) {
        if (squadRepository.findByInviteCode(request.getInviteCode()).isPresent()) {
            Map<String, Object> fail = new HashMap<>();
            fail.put("success", false);
            fail.put("error_message", "邀请码已存在");
            return ResponseEntity.ok(fail);
        }

        Squad squad = new Squad();
        squad.setSquadName(request.getSquadName());
        squad.setInviteCode(request.getInviteCode());
        squad.setAdminId("admin");
        squad.setMaxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 50);
        squad.setIsActive(true);
        squadRepository.save(squad);

        Map<String, Object> ok = new HashMap<>();
        ok.put("success", true);
        ok.put("squad_name", squad.getSquadName());
        ok.put("invite_code", squad.getInviteCode());
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
}
