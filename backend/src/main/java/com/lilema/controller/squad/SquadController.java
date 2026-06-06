package com.lilema.controller.squad;

<<<<<<< HEAD
import com.lilema.dto.ApiResponse;
import com.lilema.entity.po.Squad;
import com.lilema.service.SquadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
=======
import com.lilema.entity.po.Squad;
import com.lilema.mapper.SquadRepository;
import com.lilema.mapper.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

<<<<<<< HEAD
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/squad")
@RequiredArgsConstructor
public class SquadController {

    private final SquadService squadService;

    /**
     * POST /api/squad/create
     * <p>
     * Create a new squad.
     * Request body: {"squad_name": "...", "openid": "..."}
     * Response: the created Squad entity.
     */
    @PostMapping("/create")
    public ApiResponse<Squad> createSquad(@RequestBody Map<String, String> body) {
        String squadName = body.get("squad_name");
        String openid = body.get("openid");

        if (squadName == null || squadName.isBlank()) {
            return ApiResponse.error(400, "squad_name is required");
        }
        if (openid == null || openid.isBlank()) {
            return ApiResponse.error(400, "openid is required");
        }

        try {
            Squad squad = squadService.generateSquad(squadName, openid);
            return ApiResponse.success("Squad created successfully", squad);
        } catch (RuntimeException e) {
            log.error("Create squad error for {}: {}", openid, e.getMessage());
            return ApiResponse.error(500, e.getMessage());
        }
    }

    /**
     * POST /api/squad/join
     * <p>
     * Join a squad using an invite code.
     * Request body: {"invite_code": "...", "openid": "..."}
     * Response: the Squad entity the user joined.
     */
    @PostMapping("/join")
    public ApiResponse<Squad> joinSquad(@RequestBody Map<String, String> body) {
        String inviteCode = body.get("invite_code");
        String openid = body.get("openid");

        if (inviteCode == null || inviteCode.isBlank()) {
            return ApiResponse.error(400, "invite_code is required");
        }
        if (openid == null || openid.isBlank()) {
            return ApiResponse.error(400, "openid is required");
        }

        try {
            Squad squad = squadService.verifyInviteCode(inviteCode, openid);
            return ApiResponse.success("Joined squad successfully", squad);
        } catch (RuntimeException e) {
            log.error("Join squad error for {}: {}", openid, e.getMessage());
            return ApiResponse.error(500, e.getMessage());
=======
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
>>>>>>> origin/feat-data-viz-(Andy-Jiang)
        }
    }
}
