package com.cesa.lilema.controller;

import com.cesa.lilema.dto.ApiResponse;
import com.cesa.lilema.entity.Squad;
import com.cesa.lilema.service.SquadService;
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
        }
    }
}
