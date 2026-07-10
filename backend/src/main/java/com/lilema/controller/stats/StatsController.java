package com.lilema.controller.stats;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lilema.dto.LcUserStats;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.UserMapper;
import com.lilema.service.LcStatsRefreshService;
import com.lilema.service.LcEngineService;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
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
    private final LcStatsRefreshService lcStatsRefreshService;

    public StatsController(DailyLogMapper dailyLogMapper,
                           UserMapper userMapper,
                           LcEngineService lcEngineService,
                           LcStatsRefreshService lcStatsRefreshService) {
        this.dailyLogMapper = dailyLogMapper;
        this.userMapper = userMapper;
        this.lcEngineService = lcEngineService;
        this.lcStatsRefreshService = lcStatsRefreshService;
    }

    /** POST /api/v1/stats/refresh {"openid": "..."} -> latest LeetCode snapshot */
    @PostMapping("/refresh")
    public Map<String, Object> refresh(@RequestBody Map<String, String> body) {
        String openid = body.get("openid");
        Map<String, Object> m = new HashMap<>();
        if (openid == null || openid.isBlank()) {
            m.put("refreshed", false);
            m.put("error_msg", "openid is required");
            return m;
        }

        try {
            return lcStatsRefreshService.refreshByOpenid(openid);
        } catch (Exception e) {
            m.put("refreshed", false);
            m.put("error_msg", e.getMessage());
            return m;
        }
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

    /** GET /api/v1/stats/poster?openid= -> {poster_url, rank_tier, motto} */
    @GetMapping("/poster")
    public Map<String, Object> poster(@RequestParam String openid, HttpServletRequest request) {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
        DailyLog latest = latestLog(openid);

        String rankTier = resolveRankTier(latest, user);
        String motto = resolveMotto(rankTier);
        String posterUrl = buildBaseUrl(request)
                + "/api/v1/stats/poster/image?openid="
                + URLEncoder.encode(openid, StandardCharsets.UTF_8);

        Map<String, Object> m = new HashMap<>();
        m.put("poster_url", posterUrl);
        m.put("rank_tier", rankTier);
        m.put("motto", motto);
        return m;
    }

    /** GET /api/v1/stats/poster/image?openid= -> image/png */
    @GetMapping("/poster/image")
    public void posterImage(@RequestParam String openid, HttpServletResponse response) throws IOException {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("openid", openid).last("LIMIT 1"));
        DailyLog latest = latestLog(openid);
        String rankTier = resolveRankTier(latest, user);
        String motto = resolveMotto(rankTier);

        BufferedImage image = new BufferedImage(750, 1200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setColor(new Color(255, 250, 240));
            g.fillRect(0, 0, 750, 1200);

            g.setColor(new Color(255, 161, 22));
            g.fillRoundRect(70, 80, 610, 1040, 36, 36);

            g.setColor(Color.WHITE);
            g.fillRoundRect(95, 105, 560, 990, 28, 28);

            g.setColor(new Color(34, 34, 34));
            g.setFont(new Font("SansSerif", Font.BOLD, 54));
            g.drawString("Li-Le-Me", 245, 210);

            g.setFont(new Font("SansSerif", Font.PLAIN, 28));
            g.setColor(new Color(100, 100, 100));
            g.drawString("LeetCode battle report", 225, 260);

            g.setColor(new Color(255, 161, 22));
            g.fillRoundRect(180, 335, 390, 92, 46, 46);
            g.setColor(Color.WHITE);
            g.setFont(new Font("SansSerif", Font.BOLD, 42));
            drawCentered(g, rankTier, 375, 394);

            String lcId = user != null && user.getLcId() != null ? user.getLcId() : "Unbound";
            int totalSolved = totalSolved(user, latest);
            int dailyPoints = latest != null ? nz(latest.getDailyPoints()) : 0;

            g.setColor(new Color(34, 34, 34));
            g.setFont(new Font("SansSerif", Font.BOLD, 36));
            drawCentered(g, lcId, 375, 510);

            g.setFont(new Font("SansSerif", Font.PLAIN, 30));
            drawCentered(g, "Total solved: " + totalSolved, 375, 590);
            drawCentered(g, "Today's points: " + dailyPoints, 375, 645);

            g.setColor(new Color(68, 68, 68));
            g.setFont(new Font("SansSerif", Font.ITALIC, 30));
            drawCentered(g, motto, 375, 760);

            g.setColor(new Color(245, 245, 245));
            g.fillRoundRect(155, 855, 440, 110, 22, 22);
            g.setColor(new Color(80, 80, 80));
            g.setFont(new Font("SansSerif", Font.PLAIN, 26));
            drawCentered(g, "Keep coding. Keep climbing.", 375, 920);

            g.setColor(new Color(150, 150, 150));
            g.setFont(new Font("SansSerif", Font.PLAIN, 22));
            drawCentered(g, "Generated by Li-Le-Me", 375, 1040);
        } finally {
            g.dispose();
        }

        response.setContentType("image/png");
        response.setHeader("Cache-Control", "no-store");
        ImageIO.write(image, "png", response.getOutputStream());
    }

    /** GET /api/v1/stats/trend?openid=&range_days=7|30|365 -> {dates[], daily_points[], average_line} */
    @GetMapping("/trend")
    public Map<String, Object> trend(@RequestParam String openid,
                                     @RequestParam(name = "range_days", defaultValue = "7") int rangeDays) {
        if (rangeDays >= 365) {
            return monthlyTrend(openid);
        }
        return dailyTrend(openid, rangeDays);
    }

    private Map<String, Object> dailyTrend(String openid, int rangeDays) {
        int days = rangeDays == 30 ? 30 : 7;
        LocalDate from = LocalDate.now().minusDays(days - 1L);
        List<DailyLog> logs = dailyLogMapper.selectList(new QueryWrapper<DailyLog>()
                .eq("openid", openid).ge("log_date", from).orderByAsc("log_date"));

        Map<LocalDate, Integer> pointsByDate = new HashMap<>();
        for (DailyLog log : logs) {
            pointsByDate.put(log.getLogDate(), nz(log.getDailyPoints()));
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM-dd");
        List<String> dates = new ArrayList<>();
        List<Integer> points = new ArrayList<>();
        int sum = 0;
        for (int i = 0; i < days; i++) {
            LocalDate date = from.plusDays(i);
            int p = pointsByDate.getOrDefault(date, 0);
            dates.add(date.format(fmt));
            points.add(p);
            sum += p;
        }

        Map<String, Object> m = new HashMap<>();
        m.put("dates", dates);
        m.put("daily_points", points);
        m.put("average_line", average(sum, days));
        return m;
    }

    private Map<String, Object> monthlyTrend(String openid) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth firstMonth = currentMonth.minusMonths(11);
        LocalDate from = firstMonth.atDay(1);

        List<DailyLog> logs = dailyLogMapper.selectList(new QueryWrapper<DailyLog>()
                .eq("openid", openid)
                .ge("log_date", from)
                .orderByAsc("log_date"));

        Map<YearMonth, Integer> pointsByMonth = new HashMap<>();
        for (DailyLog log : logs) {
            YearMonth month = YearMonth.from(log.getLogDate());
            pointsByMonth.merge(month, nz(log.getDailyPoints()), Integer::sum);
        }

        List<String> dates = new ArrayList<>();
        List<Integer> points = new ArrayList<>();
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            YearMonth month = firstMonth.plusMonths(i);
            int p = pointsByMonth.getOrDefault(month, 0);
            dates.add(month.getMonthValue() + "月");
            points.add(p);
            sum += p;
        }

        Map<String, Object> m = new HashMap<>();
        m.put("dates", dates);
        m.put("daily_points", points);
        m.put("average_line", average(sum, 12));
        return m;
    }

    private DailyLog latestLog(String openid) {
        return dailyLogMapper.selectOne(new QueryWrapper<DailyLog>()
                .eq("openid", openid).orderByDesc("log_date").last("LIMIT 1"));
    }

    private String resolveRankTier(DailyLog latest, User user) {
        if (latest != null && latest.getRankTier() != null && !latest.getRankTier().isBlank()) {
            return latest.getRankTier();
        }

        int points = user != null && user.getTotalPoints() != null ? user.getTotalPoints() : 0;
        if (points >= 1000) {
            return "Hardcore";
        }
        if (points >= 600) {
            return "Top Tier";
        }
        if (points >= 300) {
            return "Elite";
        }
        if (points >= 100) {
            return "Completed";
        }
        return "NPC";
    }

    private String resolveMotto(String rankTier) {
        return switch (rankTier) {
            case "Hardcore" -> "Consistency beats intensity";
            case "Top Tier" -> "Stay hungry, stay foolish";
            case "Elite" -> "Small steps compound";
            case "Completed" -> "Done is better than perfect";
            default -> "Start today, improve tomorrow";
        };
    }

    private int totalSolved(User user, DailyLog latest) {
        if (user != null && user.getTotalSolved() != null) {
            return user.getTotalSolved();
        }
        if (latest != null && latest.getTotalSolved() != null) {
            return latest.getTotalSolved();
        }
        return 0;
    }

    private String buildBaseUrl(HttpServletRequest request) {
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null || scheme.isBlank()) {
            scheme = request.getScheme();
        }

        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getServerName() + ":" + request.getServerPort();
        }
        return scheme + "://" + host;
    }

    private void drawCentered(Graphics2D g, String text, int centerX, int baselineY) {
        int width = g.getFontMetrics().stringWidth(text);
        g.drawString(text, centerX - width / 2, baselineY);
    }

    private double average(int sum, int divisor) {
        return divisor <= 0 ? 0 : Math.round((double) sum / divisor * 100.0) / 100.0;
    }

    private static int nz(Integer i) {
        return i == null ? 0 : i;
    }
}
