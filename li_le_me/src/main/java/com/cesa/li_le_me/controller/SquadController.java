package com.cesa.li_le_me.controller;

import com.cesa.li_le_me.entity.Squad;
import com.cesa.li_le_me.repository.SquadRepository;
import com.cesa.li_le_me.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Validated
@RestController
@RequestMapping("/api/squad")
public class SquadController {

    private final SquadRepository squadRepository;
    private final UserRepository userRepository;

    public SquadController(SquadRepository squadRepository, UserRepository userRepository) {
        this.squadRepository = squadRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/verify-invite")
    public ResponseEntity<Map<String, Object>> verifyInvite(@Valid @RequestBody VerifyInviteRequest request) {
        Optional<Squad> squadOptional = squadRepository.findByInviteCode(request.getInviteCode());
        if (squadOptional.isEmpty()) {
            return ResponseEntity.ok(buildFail("邀请码不存在"));
        }

        Squad squad = squadOptional.get();
        if (!Boolean.TRUE.equals(squad.getIsActive())) {
            return ResponseEntity.ok(buildFail("该战队已关闭"));
        }

        long memberCount = userRepository.countBySquadId(squad.getId());
        if (memberCount >= squad.getMaxMembers()) {
            return ResponseEntity.ok(buildFail("战队已满"));
        }

        Map<String, Object> ok = new HashMap<>();
        ok.put("valid", true);
        ok.put("squad_name", squad.getSquadName());
        ok.put("error_msg", "");
        return ResponseEntity.ok(ok);
    }

    private Map<String, Object> buildFail(String errorMsg) {
        Map<String, Object> fail = new HashMap<>();
        fail.put("valid", false);
        fail.put("error_msg", errorMsg);
        return fail;
    }

    public static class VerifyInviteRequest {
        @NotBlank(message = "invite_code不能为空")
        private String invite_code;

        public String getInviteCode() {
            return invite_code;
        }

        public void setInviteCode(String inviteCode) {
            this.invite_code = inviteCode;
        }
    }
}
