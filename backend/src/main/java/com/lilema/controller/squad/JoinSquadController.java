package com.cesa.li_le_me.controller;

import com.cesa.li_le_me.entity.Squad;
import com.cesa.li_le_me.entity.User;
import com.cesa.li_le_me.repository.SquadRepository;
import com.cesa.li_le_me.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Validated
@RestController
@RequestMapping("/api/user")
public class JoinSquadController {

    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[\\u4e00-\\u9fa5a-zA-Z0-9]{2,20}$");

    private final UserRepository userRepository;
    private final SquadRepository squadRepository;

    public JoinSquadController(UserRepository userRepository, SquadRepository squadRepository) {
        this.userRepository = userRepository;
        this.squadRepository = squadRepository;
    }

    @PostMapping("/join-squad")
    public ResponseEntity<Map<String, Object>> joinSquad(@Valid @RequestBody JoinSquadRequest request) {
        User user = userRepository.findByOpenid(request.getOpenid())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));

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

        if (!NICKNAME_PATTERN.matcher(request.getUserNickname()).matches()) {
            return ResponseEntity.ok(buildFail("昵称格式不正确：需为2-20位中文、英文或数字"));
        }

        user.setNickname(request.getUserNickname());
        user.setAvatarFileId(request.getAvatarFileId());
        user.setSquadId(squad.getId());
        user.setRegistrationStatus(2);
        userRepository.save(user);

        Map<String, Object> ok = new HashMap<>();
        ok.put("join_success", true);
        ok.put("squad_name", squad.getSquadName());
        return ResponseEntity.ok(ok);
    }

    private Map<String, Object> buildFail(String errorMsg) {
        Map<String, Object> fail = new HashMap<>();
        fail.put("join_success", false);
        fail.put("error_msg", errorMsg);
        return fail;
    }

    public static class JoinSquadRequest {
        @NotBlank(message = "openid不能为空")
        private String openid;

        @NotBlank(message = "invite_code不能为空")
        private String invite_code;

        @NotBlank(message = "user_nickname不能为空")
        private String user_nickname;

        private String avatar_file_id;

        public String getOpenid() {
            return openid;
        }

        public void setOpenid(String openid) {
            this.openid = openid;
        }

        public String getInviteCode() {
            return invite_code;
        }

        public void setInviteCode(String inviteCode) {
            this.invite_code = inviteCode;
        }

        public String getUserNickname() {
            return user_nickname;
        }

        public void setUserNickname(String userNickname) {
            this.user_nickname = userNickname;
        }

        public String getAvatarFileId() {
            return avatar_file_id;
        }

        public void setAvatarFileId(String avatarFileId) {
            this.avatar_file_id = avatarFileId;
        }
    }
}
