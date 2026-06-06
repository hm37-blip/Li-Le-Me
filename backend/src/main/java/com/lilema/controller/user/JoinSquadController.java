package com.lilema.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * master 前端契约:加入战队(设置昵称/头像 + 入队 + 状态置 2)。
 */
@RestController
@RequestMapping("/api/v1/user")
public class JoinSquadController {

    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[\\u4e00-\\u9fa5a-zA-Z0-9]{2,20}$");

    private final UserMapper userMapper;
    private final SquadMapper squadMapper;

    public JoinSquadController(UserMapper userMapper, SquadMapper squadMapper) {
        this.userMapper = userMapper;
        this.squadMapper = squadMapper;
    }

    @PostMapping("/squad/join")
    public ResponseEntity<Map<String, Object>> joinSquad(@RequestBody Map<String, String> body) {
        String openid = body.get("openid");
        String inviteCode = body.get("invite_code");
        String nickname = body.get("user_nickname");
        String avatarFileId = body.get("avatar_file_id");

        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(fail("用户不存在"));
        }

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

        if (nickname == null || !NICKNAME_PATTERN.matcher(nickname).matches()) {
            return ResponseEntity.ok(fail("昵称格式不正确：需为2-20位中文、英文或数字"));
        }

        userMapper.update(null, new UpdateWrapper<User>().eq("openid", openid)
                .set("nickname", nickname)
                .set("avatar_url", avatarFileId)
                .set("squad_id", squad.getId())
                .set("registration_status", 2));

        Map<String, Object> ok = new HashMap<>();
        ok.put("squad_join_success", true);
        ok.put("squad_name", squad.getSquadName());
        return ResponseEntity.ok(ok);
    }

    private Map<String, Object> fail(String msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("squad_join_success", false);
        m.put("error_msg", msg);
        return m;
    }
}
