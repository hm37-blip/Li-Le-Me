package com.lilema.controller.stats;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lilema.dto.LcUserStats;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.UserMapper;
import com.lilema.service.LcEngineService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * master 战报页契约:难度分布 + 积分趋势。真实数据来自 daily_logs(由结算任务/抓取写入);
 * 若该用户还没有结算记录,distribution 走实时抓取兜底。
 */
@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    private final DailyLogMapper dailyLogMapper;
    private final UserMapper userMapper;
    private final LcEngineService lcEngineService;

    public StatsController(DailyLogMapper dailyLogMapper, UserMapper userMapper, LcEngineService lcEngineService) {
        this.dailyLogMapper = dailyLogMapper;
        this.userMapper = userMapper;
        this.lcEngineService = lcEngineService;
    }

    /** GET /api/v1/stats/distribution?openid=&type=TOTAL|MONTHLY -> {easy, medium, hard} */
    @GetMapping("/distribution")
    public Map<String, Object> distribution(@RequestParam String openid,
                                            @RequestParam(defaultValue = "TOTAL") String type) {
        int easy = 0, medium = 0, hard = 0;

        DailyLog latest = dailyLogMapper.selectOne(new QueryWrapper<DailyLog>()
                .eq("openid", openid).orderByDesc("log_date").last("LIMIT 1"));

        if (latest != null) {
            if ("MONTHLY".equalsIgnoreCase(type)) {
                LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
                DailyLog baseline = dailyLogMapper.selectOne(new QueryWrapper<DailyLog>()
                        .eq("openid", openid).lt("log_date", monthStart).orderByDesc("log_date").last("LIMIT 1"));
                easy = Math.max(0, nz(latest.getEasyCount()) - (baseline != null ? nz(baseline.getEasyCount()) : 0));
                medium = Math.max(0, nz(latest.getMediumCount()) - (baseline != null ? nz(baseline.getMediumCount()) : 0));
                hard = Math.max(0, nz(latest.getHardCount()) - (baseline != null ? nz(baseline.getHardCount()) : 0));
            } else {
                easy = nz(latest.getEasyCount());
                medium = nz(latest.getMediumCount());
                hard = nz(latest.getHardCount());
            }
        } else {
            // no settled data yet -> live fetch as a fallback
            User u = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
            if (u != null && u.getLcId() != null && !u.getLcId().isBlank()) {
                try {
                    LcUserStats s = lcEngineService.fetchStats(u.getLcId());
                    easy = s.getEasySolved();
                    medium = s.getMediumSolved();
                    hard = s.getHardSolved();
                } catch (Exception ignored) {
                    // leave zeros on failure
                }
            }
        }

        Map<String, Object> m = new HashMap<>();
        m.put("easy", easy);
        m.put("medium", medium);
        m.put("hard", hard);
        return m;
    }

    /** GET /api/v1/stats/trend?openid=&range_days=7|30|365 -> {dates[], daily_points[], average_line} */
    @GetMapping("/trend")
    public Map<String, Object> trend(@RequestParam String openid,
                                     @RequestParam(name = "range_days", defaultValue = "7") int rangeDays) {
        LocalDate from = LocalDate.now().minusDays(Math.max(1, rangeDays) - 1L);
        List<DailyLog> logs = dailyLogMapper.selectList(new QueryWrapper<DailyLog>()
                .eq("openid", openid).ge("log_date", from).orderByAsc("log_date"));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM-dd");
        List<String> dates = new ArrayList<>();
        List<Integer> points = new ArrayList<>();
        int sum = 0;
        for (DailyLog l : logs) {
            dates.add(l.getLogDate().format(fmt));
            int p = nz(l.getDailyPoints());
            points.add(p);
            sum += p;
        }
        double avg = points.isEmpty() ? 0 : Math.round((double) sum / points.size() * 100.0) / 100.0;

        Map<String, Object> m = new HashMap<>();
        m.put("dates", dates);
        m.put("daily_points", points);
        m.put("average_line", avg);
        return m;
    }

    private static int nz(Integer i) {
        return i == null ? 0 : i;
    }
}
