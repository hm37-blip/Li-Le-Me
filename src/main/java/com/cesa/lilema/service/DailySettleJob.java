package com.cesa.lilema.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.cesa.lilema.dto.LcUserStats;
import com.cesa.lilema.entity.DailyLog;
import com.cesa.lilema.entity.User;
import com.cesa.lilema.mapper.DailyLogMapper;
import com.cesa.lilema.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailySettleJob {

    private final LcEngineService lcEngineService;
    private final UserMapper userMapper;
    private final DailyLogMapper dailyLogMapper;

    /**
     * Daily settlement job – runs every day at 22:00.
     * <p>
     * For every user with a bound LeetCode account:
     * <ol>
     *   <li>Fetch today's cumulative stats from LeetCode.</li>
     *   <li>Compare with yesterday's daily_log to compute delta (easy/medium/hard added).</li>
     *   <li>Calculate daily_points and write/update the daily_log row.</li>
     * </ol>
     * After all users are processed, compute rank_tier per squad and update users table.
     */
    @Scheduled(cron = "0 0 22 * * ?")
    public void settle() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        log.info("=== DailySettleJob starting for date: {} ===", today);

        List<User> users = userMapper.selectAllWithLcId();
        log.info("Total users with LC account: {}", users.size());

        List<String> failedUsers = new ArrayList<>();
        List<DailyLog> successLogs = new ArrayList<>();

        for (User user : users) {
            try {
                // Rate-limiting pause before each API call
                Thread.sleep(500);

                LcUserStats stats = lcEngineService.fetchStats(user.getLcId());

                // Retrieve yesterday's log to compute deltas
                DailyLog yesterdayLog = dailyLogMapper.selectByOpenidAndDate(user.getOpenid(), yesterday);
                int prevEasy   = yesterdayLog != null ? yesterdayLog.getEasyCount()   : 0;
                int prevMedium = yesterdayLog != null ? yesterdayLog.getMediumCount() : 0;
                int prevHard   = yesterdayLog != null ? yesterdayLog.getHardCount()   : 0;
                int prevTotal  = yesterdayLog != null ? yesterdayLog.getTotalSolved()  : 0;

                int easyAdded   = Math.max(0, stats.getEasySolved()   - prevEasy);
                int mediumAdded = Math.max(0, stats.getMediumSolved() - prevMedium);
                int hardAdded   = Math.max(0, stats.getHardSolved()   - prevHard);
                int dailySteps  = Math.max(0, stats.getTotalSolved()  - prevTotal);

                // daily_points = easy*1 + medium*2 + hard*3
                int dailyPoints = easyAdded * 1 + mediumAdded * 2 + hardAdded * 3;

                // Upsert daily_log
                DailyLog todayLog = dailyLogMapper.selectByOpenidAndDate(user.getOpenid(), today);
                if (todayLog == null) {
                    todayLog = new DailyLog();
                    todayLog.setOpenid(user.getOpenid());
                    todayLog.setLogDate(today);
                }
                todayLog.setTotalSolved(stats.getTotalSolved());
                todayLog.setDailySteps(dailySteps);
                todayLog.setEasyCount(stats.getEasySolved());
                todayLog.setMediumCount(stats.getMediumSolved());
                todayLog.setHardCount(stats.getHardSolved());
                todayLog.setDailyPoints(dailyPoints);

                if (todayLog.getId() == null) {
                    dailyLogMapper.insert(todayLog);
                } else {
                    dailyLogMapper.updateById(todayLog);
                }

                successLogs.add(todayLog);

                // Update user snapshot
                UpdateWrapper<User> uw = new UpdateWrapper<>();
                uw.eq("openid", user.getOpenid())
                  .set("total_solved", stats.getTotalSolved())
                  .set("daily_steps", dailySteps)
                  .set("total_points", (user.getTotalPoints() == null ? 0 : user.getTotalPoints()) + dailyPoints)
                  .set("last_update", LocalDateTime.now());
                userMapper.update(null, uw);

                log.debug("Settled user {} ({}): steps={}, points={}", user.getOpenid(), user.getLcId(), dailySteps, dailyPoints);

            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.error("Settlement interrupted for user: {}", user.getOpenid());
                failedUsers.add(user.getLcId());
            } catch (RuntimeException e) {
                log.error("Failed to settle user {} ({}): {}", user.getOpenid(), user.getLcId(), e.getMessage());
                failedUsers.add(user.getLcId());
            }
        }

        // --- Rank tier calculation (per squad) ---
        computeRankTiers(today);

        log.info("=== DailySettleJob finished. Processed={}, Failed={} ===",
                users.size() - failedUsers.size(), failedUsers.size());
        if (!failedUsers.isEmpty()) {
            log.warn("Failed LC usernames: {}", failedUsers);
        }
    }

    /**
     * For every squad, rank members by today's daily_points and assign rank_tier.
     * <p>
     * Tier thresholds (by percentile within the squad):
     * <ul>
     *   <li>Top 0–20 % → "夯"</li>
     *   <li>21–40 % → "顶级"</li>
     *   <li>41–60 % → "人上人"</li>
     *   <li>61–80 % → "NPC"</li>
     *   <li>81–100 % → "拉完了"</li>
     * </ul>
     * If the squad has fewer than 5 members, or all members scored 0 points today,
     * everyone receives "拉完了".
     */
    private void computeRankTiers(LocalDate today) {
        // Gather all users grouped by squad
        List<User> allUsers = userMapper.selectAllWithLcId();
        Map<Long, List<User>> bySquad = allUsers.stream()
                .filter(u -> u.getSquadId() != null)
                .collect(Collectors.groupingBy(User::getSquadId));

        for (Map.Entry<Long, List<User>> entry : bySquad.entrySet()) {
            Long squadId = entry.getKey();
            List<User> squadMembers = entry.getValue();

            // Fetch today's logs for this squad
            List<DailyLog> logs = dailyLogMapper.selectBySquadAndDate(squadId, today);
            if (logs.isEmpty()) {
                continue;
            }

            int memberCount = logs.size();
            boolean allZero = logs.stream().allMatch(l -> l.getDailyPoints() == 0);

            if (memberCount < 5 || allZero) {
                // Everyone gets "拉完了"
                logs.forEach(l -> {
                    l.setRankTier("拉完了");
                    dailyLogMapper.updateById(l);
                });
                continue;
            }

            // Sort descending by daily_points
            List<DailyLog> sorted = logs.stream()
                    .sorted(Comparator.comparingInt(DailyLog::getDailyPoints).reversed())
                    .collect(Collectors.toList());

            for (int i = 0; i < sorted.size(); i++) {
                // percentile = position / total  (0-based index / count, gives 0.0 to ~1.0)
                double percentile = (double) i / memberCount;
                String tier;
                if (percentile < 0.20) {
                    tier = "夯";
                } else if (percentile < 0.40) {
                    tier = "顶级";
                } else if (percentile < 0.60) {
                    tier = "人上人";
                } else if (percentile < 0.80) {
                    tier = "NPC";
                } else {
                    tier = "拉完了";
                }
                sorted.get(i).setRankTier(tier);
                dailyLogMapper.updateById(sorted.get(i));
            }

            log.debug("Rank tiers assigned for squad {}, {} members", squadId, memberCount);
        }
    }
}
