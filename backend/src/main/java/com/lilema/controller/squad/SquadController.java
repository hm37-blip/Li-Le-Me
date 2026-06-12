package com.lilema.controller.squad;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lilema.dto.ApiResponse;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import com.lilema.service.SquadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * User-side squad contract:
 * - POST /api/v1/squad/create creates a squad for the requesting user.
 * - POST /api/v1/squad/verify validates an invite code; joining uses /api/v1/user/squad/join.
 */
@RestController
@RequestMapping("/api/v1/squad")
public class SquadController {

    private final SquadMapper squadMapper;
    private final UserMapper userMapper;
    private final SquadService squadService;

    public SquadController(SquadMapper squadMapper, UserMapper userMapper, SquadService squadService) {
        this.squadMapper = squadMapper;
        this.userMapper = userMapper;
        this.squadService = squadService;
    }

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
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyInvite(@RequestBody Map<String, String> body) {
        String inviteCode = body.get("invite_code");

        Squad squad = squadMapper.selectOne(new QueryWrapper<Squad>().eq("invite_code", inviteCode).last("LIMIT 1"));
        if (squad == null) {
            return ResponseEntity.ok(fail("邀请码不存在"));
        }
        if (!Boolean.TRUE.equals(squad.getIsActive())) {
            return ResponseEntity.ok(fail("该战队已关闭"));
        }
        long memberCount = userMapper.selectCount(new QueryWrapper<User>().eq("squad_id", squad.getId()));
        if (memberCount >= squad.getMaxMembers()) {
            return ResponseEntity.ok(fail("战队已满"));
        }

        Map<String, Object> ok = new HashMap<>();
        ok.put("valid", true);
        ok.put("squad_name", squad.getSquadName());
        ok.put("error_msg", "");
        return ResponseEntity.ok(ok);
    }

    private Map<String, Object> fail(String msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("valid", false);
        m.put("error_msg", msg);
        return m;
    }
}
