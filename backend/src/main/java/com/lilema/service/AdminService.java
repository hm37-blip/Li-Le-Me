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

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final SquadMapper squadMapper;
    private final UserMapper userMapper;

    public List<Squad> getAllSquads() {
        return squadMapper.selectList(null);
    }

    public long countMembersBySquadId(Long squadId) {
        return userMapper.selectCount(new QueryWrapper<User>().eq("squad_id", squadId));
    }

    public boolean existsSquadByInviteCode(String inviteCode) {
        return squadMapper.selectCount(new QueryWrapper<Squad>().eq("invite_code", inviteCode)) > 0;
    }

    public boolean existsSquadByName(String squadName) {
        return squadMapper.selectCount(new QueryWrapper<Squad>().eq("squad_name", squadName)) > 0;
    }

    public Squad getSquadById(Long id) {
        return squadMapper.selectById(id);
    }

    public Squad createSquad(String squadName, String inviteCode, Integer maxMembers) {
        Squad squad = new Squad();
        squad.setSquadName(squadName);
        squad.setInviteCode(inviteCode);
        squad.setAdminOpenid("admin");
        squad.setMaxMembers(maxMembers != null ? maxMembers : 50);
        squad.setMemberCount(0);
        squad.setIsActive(true);
        squad.setCreatedAt(LocalDateTime.now());
        squadMapper.insert(squad);
        log.info("Admin created squad: name={}, inviteCode={}", squadName, inviteCode);
        return squad;
    }

    public Squad updateSquad(Long id, String squadName, String inviteCode, Integer maxMembers) {
        Squad squad = squadMapper.selectById(id);
        if (squad == null) return null;
        squad.setSquadName(squadName);
        squad.setInviteCode(inviteCode);
        if (maxMembers != null) {
            squad.setMaxMembers(maxMembers);
        }
        squadMapper.updateById(squad);
        log.info("Admin updated squad: id={}", id);
        return squad;
    }

    public List<User> getMembersBySquadId(Long squadId) {
        return userMapper.selectBySquadId(squadId);
    }

    @Transactional
    public void deleteSquad(Long id) {
        // Demote all members: clear squad_id, set registration_status=1
        List<User> members = userMapper.selectBySquadId(id);
        for (User member : members) {
            UpdateWrapper<User> uw = new UpdateWrapper<>();
            uw.eq("id", member.getId())
              .set("squad_id", null)
              .set("registration_status", 1);
            userMapper.update(null, uw);
        }
        squadMapper.deleteById(id);
        log.info("Admin deleted squad: id={}, demoted {} members", id, members.size());
    }

    public User getUserById(Long userId) {
        return userMapper.selectById(userId);
    }

    public void removeMemberFromSquad(Long userId) {
        UpdateWrapper<User> uw = new UpdateWrapper<>();
        uw.eq("id", userId)
          .set("squad_id", null)
          .set("registration_status", 1);
        userMapper.update(null, uw);
        log.info("Admin removed user {} from squad", userId);
    }
}
