package com.lilema.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lilema.dto.LcUserStats;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.UserMapper;
import com.lilema.service.LcEngineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserReportController {

    private final UserMapper userMapper;
    private final DailyLogMapper dailyLogMapper;
    private final LcEngineService lcEngineService;

    public UserReportController(UserMapper userMapper,
                                DailyLogMapper dailyLogMapper,
                                LcEngineService lcEngineService) {
        this.userMapper = userMapper;
        this.dailyLogMapper = dailyLogMapper;
        this.lcEngineService = lcEngineService;
    }

    /**
     * GET /api/user/report?lcId=&range=week|month|year
     */
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> report(@RequestParam String lcId,
                                                      @RequestParam(defaultValue = "week") String range) {
        User user = findUserByLcId(lcId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("用户不存在"));
        }

        try {
            DailyLog latest = latestLog(user.getOpenid());
            Difficulty difficulty = latest != null
                    ? new Difficulty(nz(latest.getEasyCount()), nz(latest.getMediumCount()), nz(latest.getHardCount()))
                    : fetchDifficultyFallback(user);

            Map<String, Object> data = new HashMap<>();
            data.put("totalSolved", resolveTotalSolved(user, latest, difficulty));
            data.put("consecutiveDays", calculateConsecutiveDays(user.getOpenid(), range));

            Map<String, Object> difficultyMap = new HashMap<>();
            difficultyMap.put("easy", difficulty.easy);
            difficultyMap.put("medium", difficulty.medium);
            difficultyMap.put("hard", difficulty.hard);
            data.put("difficulty", difficultyMap);

            return ResponseEntity.ok(success(data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("服务器错误"));
        }
    }

    /**
     * GET /api/user/info?lcId=
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info(@RequestParam String lcId) {
        User user = findUserByLcId(lcId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("用户不存在"));
        }

        DailyLog latest = latestLog(user.getOpenid());
        Difficulty difficulty = latest != null
                ? new Difficulty(nz(latest.getEasyCount()), nz(latest.getMediumCount()), nz(latest.getHardCount()))
                : fetchDifficultyFallback(user);

        Map<String, Object> data = new HashMap<>();
        data.put("lcId", user.getLcId());
        data.put("avatar", user.getAvatarUrl());
        data.put("totalSolved", resolveTotalSolved(user, latest, difficulty));
        data.put("ranking", 0);

        return ResponseEntity.ok(success(data));
    }

    private User findUserByLcId(String lcId) {
        if (lcId == null || lcId.isBlank()) {
            return null;
        }
        return userMapper.selectOne(new QueryWrapper<User>()
                .eq("lc_id", lcId)
                .last("LIMIT 1"));
    }

    private DailyLog latestLog(String openid) {
        return dailyLogMapper.selectOne(new QueryWrapper<DailyLog>()
                .eq("openid", openid)
                .orderByDesc("log_date")
                .last("LIMIT 1"));
    }

    private int calculateConsecutiveDays(String openid, String range) {
        int days = switch (range == null ? "week" : range.toLowerCase()) {
            case "month" -> 30;
            case "year" -> 365;
            default -> 7;
        };

        LocalDate from = LocalDate.now().minusDays(days - 1L);
        Map<LocalDate, Integer> pointsByDate = new HashMap<>();
        dailyLogMapper.selectList(new QueryWrapper<DailyLog>()
                .eq("openid", openid)
                .ge("log_date", from)
                .orderByAsc("log_date"))
                .forEach(log -> pointsByDate.put(log.getLogDate(), nz(log.getDailyPoints())));

        int consecutive = 0;
        for (LocalDate date = LocalDate.now(); !date.isBefore(from); date = date.minusDays(1)) {
            if (pointsByDate.getOrDefault(date, 0) <= 0) {
                break;
            }
            consecutive++;
        }
        return consecutive;
    }

    private Difficulty fetchDifficultyFallback(User user) {
        if (user.getLcId() == null || user.getLcId().isBlank()) {
            return new Difficulty(0, 0, 0);
        }
        try {
            LcUserStats stats = lcEngineService.fetchStats(user.getLcId());
            return new Difficulty(stats.getEasySolved(), stats.getMediumSolved(), stats.getHardSolved());
        } catch (Exception ignored) {
            return new Difficulty(0, 0, 0);
        }
    }

    private int resolveTotalSolved(User user, DailyLog latest, Difficulty difficulty) {
        if (user.getTotalSolved() != null && user.getTotalSolved() > 0) {
            return user.getTotalSolved();
        }
        if (latest != null && latest.getTotalSolved() != null) {
            return latest.getTotalSolved();
        }
        return difficulty.easy + difficulty.medium + difficulty.hard;
    }

    private Map<String, Object> success(Map<String, Object> data) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 0);
        response.put("message", "success");
        response.put("data", data);
        return response;
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", -1);
        response.put("message", message);
        return response;
    }

    private static int nz(Integer value) {
        return value == null ? 0 : value;
    }

    private record Difficulty(int easy, int medium, int hard) {
    }
}
