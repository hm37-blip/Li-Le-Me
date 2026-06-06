package com.lilema.controller.squad;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * master 前端契约:校验邀请码(只校验,不入队;入队走 /api/user/join-squad)。
 */
@RestController
@RequestMapping("/api/squad")
public class SquadController {

    private final SquadMapper squadMapper;
    private final UserMapper userMapper;

    public SquadController(SquadMapper squadMapper, UserMapper userMapper) {
        this.squadMapper = squadMapper;
        this.userMapper = userMapper;
    }

    @PostMapping("/verify-invite")
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
