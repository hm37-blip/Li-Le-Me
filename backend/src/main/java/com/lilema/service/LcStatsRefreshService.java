package com.lilema.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.lilema.dto.LcUserStats;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class LcStatsRefreshService {

    private final LcEngineService lcEngineService;
    private final UserMapper userMapper;
    private final DailyLogMapper dailyLogMapper;

    public LcStatsRefreshService(LcEngineService lcEngineService,
                                 UserMapper userMapper,
                                 DailyLogMapper dailyLogMapper) {
        this.lcEngineService = lcEngineService;
        this.userMapper = userMapper;
        this.dailyLogMapper = dailyLogMapper;
    }

    @Transactional
    public Map<String, Object> bindAndRefresh(User user, String lcUsername) throws Exception {
        LcUserStats stats = lcEngineService.fetchStats(lcUsername);

        userMapper.update(null, new UpdateWrapper<User>()
                .eq("openid", user.getOpenid())
                .set("lc_id", lcUsername)
                .set("registration_status", 1)
                .set("total_solved", stats.getTotalSolved())
                .set("last_update", LocalDateTime.now()));

        upsertSnapshotLog(user.getOpenid(), stats);
        return response(stats);
    }

    @Transactional
    public Map<String, Object> refreshByOpenid(String openid) throws Exception {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        if (user.getLcId() == null || user.getLcId().isBlank()) {
            throw new IllegalArgumentException("用户未绑定 LeetCode");
        }

        LcUserStats stats = lcEngineService.fetchStats(user.getLcId());
        userMapper.update(null, new UpdateWrapper<User>()
                .eq("openid", openid)
                .set("total_solved", stats.getTotalSolved())
                .set("last_update", LocalDateTime.now()));

        upsertSnapshotLog(openid, stats);
        return response(stats);
    }

    private void upsertSnapshotLog(String openid, LcUserStats stats) {
        LocalDate today = LocalDate.now();
        DailyLog todayLog = dailyLogMapper.selectByOpenidAndDate(openid, today);
        if (todayLog == null) {
            todayLog = new DailyLog();
            todayLog.setOpenid(openid);
            todayLog.setLogDate(today);
            todayLog.setDailySteps(0);
            todayLog.setDailyPoints(0);
        }

        todayLog.setTotalSolved(stats.getTotalSolved());
        todayLog.setEasyCount(stats.getEasySolved());
        todayLog.setMediumCount(stats.getMediumSolved());
        todayLog.setHardCount(stats.getHardSolved());

        if (todayLog.getId() == null) {
            dailyLogMapper.insert(todayLog);
        } else {
            dailyLogMapper.updateById(todayLog);
        }
    }

    private Map<String, Object> response(LcUserStats stats) {
        Map<String, Object> data = new HashMap<>();
        data.put("refreshed", true);
        data.put("totalSolved", stats.getTotalSolved());
        data.put("easy", stats.getEasySolved());
        data.put("medium", stats.getMediumSolved());
        data.put("hard", stats.getHardSolved());
        return data;
    }
}
