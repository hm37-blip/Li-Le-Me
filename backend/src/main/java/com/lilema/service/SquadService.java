package com.lilema.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class SquadService {

    private static final String INVITE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int INVITE_CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SquadMapper squadMapper;
    private final UserMapper userMapper;

    /**
     * Create a new squad and set the creator as admin.
     *
     * @param squadName   display name for the squad
     * @param adminOpenid the openid of the user creating the squad
     * @return the newly created {@link Squad}
     */
    @Transactional
    public Squad generateSquad(String squadName, String adminOpenid) {
        String inviteCode = generateUniqueInviteCode();

        Squad squad = new Squad();
        squad.setSquadName(squadName);
        squad.setInviteCode(inviteCode);
        squad.setAdminOpenid(adminOpenid);
        squad.setMaxMembers(50);
        squad.setMemberCount(1); // admin counts as the first member
        squad.setIsActive(true);
        squad.setCreatedAt(LocalDateTime.now());

        squadMapper.insert(squad);
        log.info("Squad created: id={}, name={}, inviteCode={}, admin={}", squad.getId(), squadName, inviteCode, adminOpenid);

        // Add the admin to the squad
        UpdateWrapper<User> uw = new UpdateWrapper<>();
        uw.eq("openid", adminOpenid).set("squad_id", squad.getId());
        userMapper.update(null, uw);

        return squad;
    }

    /**
     * Validate an invite code and add the user to the corresponding squad.
     *
     * @param inviteCode the 6-character invite code
     * @param openid     the openid of the joining user
     * @return the {@link Squad} the user has joined
     */
    @Transactional
    public Squad verifyInviteCode(String inviteCode, String openid) {
        Squad squad = squadMapper.selectOne(
                new QueryWrapper<Squad>().eq("invite_code", inviteCode));

        if (squad == null) {
            throw new RuntimeException("Invalid invite code: " + inviteCode);
        }
        if (!squad.getIsActive()) {
            throw new RuntimeException("This squad is no longer active");
        }
        if (squad.getMemberCount() >= squad.getMaxMembers()) {
            throw new RuntimeException("Squad is full (max " + squad.getMaxMembers() + " members)");
        }

        // Check the user isn't already in a squad
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid));
        if (user == null) {
            throw new RuntimeException("User not found: " + openid);
        }
        if (user.getSquadId() != null) {
            throw new RuntimeException("User is already in a squad");
        }

        // Update user's squad_id
        UpdateWrapper<User> userUpdate = new UpdateWrapper<>();
        userUpdate.eq("openid", openid).set("squad_id", squad.getId());
        userMapper.update(null, userUpdate);

        // Increment squad member count
        UpdateWrapper<Squad> squadUpdate = new UpdateWrapper<>();
        squadUpdate.eq("id", squad.getId()).setSql("member_count = member_count + 1");
        squadMapper.update(null, squadUpdate);

        // Reload to return up-to-date count
        squad.setMemberCount(squad.getMemberCount() + 1);
        log.info("User {} joined squad {} ({})", openid, squad.getId(), squad.getSquadName());

        return squad;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Generate a 6-character alphanumeric invite code that does not yet exist in the DB.
     */
    private String generateUniqueInviteCode() {
        int maxAttempts = 10;
        for (int i = 0; i < maxAttempts; i++) {
            String code = randomCode();
            long count = squadMapper.selectCount(new QueryWrapper<Squad>().eq("invite_code", code));
            if (count == 0) {
                return code;
            }
        }
        throw new RuntimeException("Could not generate a unique invite code after " + maxAttempts + " attempts");
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(INVITE_CODE_LENGTH);
        for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
            sb.append(INVITE_CODE_CHARS.charAt(RANDOM.nextInt(INVITE_CODE_CHARS.length())));
        }
        return sb.toString();
    }
}
