package com.lilema.controller.squad;

import com.lilema.dto.ApiResponse;
import com.lilema.entity.po.Squad;
import com.lilema.service.SquadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/squad")
@RequiredArgsConstructor
public class UserSquadController {

    private final SquadService squadService;

    /**
     * Create a squad and set the requesting user as the squad admin.
     * Request body: {"squad_name": "...", "openid": "..."}
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
     * Join a squad using an invite code.
     * Request body: {"invite_code": "...", "openid": "..."}
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
        }
    }
}
