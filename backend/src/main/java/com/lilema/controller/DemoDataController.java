package com.lilema.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.lilema.dto.ApiResponse;
import com.lilema.dto.LcUserStats;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.UserMapper;
import com.lilema.service.LcEngineService;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Demo 辅助接口(仅非 prod)。
 * 真实部署里 daily_logs 由每天 22:00 的结算任务逐日累积;录 demo 当天没有历史,
 * 这里用真实当前总数反推一条"逐日上升"的历史曲线(最新一天 = 真实总数),
 * 让趋势图有内容,且锚定真实数据。
 */
@RestController
@RequestMapping("/debug")
@Profile("!prod")
public class DemoDataController {

    private final DailyLogMapper dailyLogMapper;
    private final UserMapper userMapper;
    private final LcEngineService lcEngineService;

    public DemoDataController(DailyLogMapper dailyLogMapper, UserMapper userMapper, LcEngineService lcEngineService) {
        this.dailyLogMapper = dailyLogMapper;
        this.userMapper = userMapper;
        this.lcEngineService = lcEngineService;
    }

    /** POST /debug/backfill?openid=&days=30 */
    @PostMapping("/backfill")
    public ApiResponse<String> backfill(@RequestParam String openid,
                                        @RequestParam(defaultValue = "30") int days) {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
        if (user == null) {
            return ApiResponse.error(404, "user not found: " + openid);
        }
        if (user.getLcId() == null || user.getLcId().isBlank()) {
            return ApiResponse.error(400, "user has no bound LeetCode account");
        }

        LcUserStats real;
        try {
            real = lcEngineService.fetchStats(user.getLcId());
        } catch (Exception e) {
            return ApiResponse.error(500, "LC fetch failed: " + e.getMessage());
        }

        int n = Math.max(2, days);
        // wipe existing logs for a clean curve
        dailyLogMapper.delete(new QueryWrapper<DailyLog>().eq("openid", openid));

        LocalDate today = LocalDate.now();
        // baseline = cumulative just BEFORE the window (70% of real total); the window shows the last 30% growth,
        // so day-1 doesn't spike with the whole baseline.
        int prevEasy = (int) Math.round(real.getEasySolved() * 0.70);
        int prevMedium = (int) Math.round(real.getMediumSolved() * 0.70);
        int prevHard = (int) Math.round(real.getHardSolved() * 0.70);
        int prevTotal = prevEasy + prevMedium + prevHard;
        for (int i = 0; i < n; i++) {
            LocalDate date = today.minusDays(n - 1L - i); // i=0 oldest ... i=n-1 today
            double frac = 0.70 + 0.30 * ((double) (i + 1) / n); // first day just above baseline, last day = 1.0
            int easyC = (int) Math.round(real.getEasySolved() * frac);
            int mediumC = (int) Math.round(real.getMediumSolved() * frac);
            int hardC = (int) Math.round(real.getHardSolved() * frac);
            int totalC = easyC + mediumC + hardC;

            int dEasy = Math.max(0, easyC - prevEasy);
            int dMedium = Math.max(0, mediumC - prevMedium);
            int dHard = Math.max(0, hardC - prevHard);
            int dailyPoints = dEasy * 1 + dMedium * 2 + dHard * 3;
            int dailySteps = Math.max(0, totalC - prevTotal);

            DailyLog log = new DailyLog();
            log.setOpenid(openid);
            log.setLogDate(date);
            log.setTotalSolved(totalC);
            log.setDailySteps(dailySteps);
            log.setEasyCount(easyC);
            log.setMediumCount(mediumC);
            log.setHardCount(hardC);
            log.setDailyPoints(dailyPoints);
            log.setCreatedAt(LocalDateTime.now());
            dailyLogMapper.insert(log);

            prevEasy = easyC; prevMedium = mediumC; prevHard = hardC; prevTotal = totalC;
        }

        // sync user snapshot to real totals
        userMapper.update(null, new UpdateWrapper<User>().eq("openid", openid)
                .set("total_solved", real.getTotalSolved())
                .set("last_update", LocalDateTime.now()));

        return ApiResponse.success("backfilled " + n + " days for " + user.getLcId()
                + " (total " + real.getTotalSolved() + ")", null);
    }
}
