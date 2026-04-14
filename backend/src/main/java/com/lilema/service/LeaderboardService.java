package com.lilema.service;

import com.lilema.dto.LeaderboardDTO;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.Squad;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.SquadMapper;
import com.lilema.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final SquadMapper squadMapper;
    private final UserMapper userMapper;
    private final DailyLogMapper dailyLogMapper;

    /**
     * Build the daily leaderboard for a squad on a given date.
     *
     * @param squadId the squad to show rankings for
     * @param openid  the requesting user's openid (used to populate mySummary)
     * @param date    the date of the leaderboard (defaults to today if null)
     * @return a fully populated {@link LeaderboardDTO.LeaderboardResponse}
     */
    public LeaderboardDTO.LeaderboardResponse getDailyLeaderboard(Long squadId, String openid, LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        // 1. Get squad info
        Squad squad = squadMapper.selectById(squadId);
        if (squad == null) {
            throw new RuntimeException("Squad not found: " + squadId);
        }

        // 2. Get all users in the squad (for profile info)
        List<User> squadUsers = userMapper.selectBySquadId(squadId);
        Map<String, User> userByOpenid = squadUsers.stream()
                .collect(Collectors.toMap(User::getOpenid, u -> u));

        // 3. Get daily logs for this squad on the requested date
        List<DailyLog> logs = dailyLogMapper.selectBySquadAndDate(squadId, date);

        // 4. Sort by daily_points desc, then total_points desc as tiebreaker
        List<DailyLog> sorted = logs.stream()
                .sorted(Comparator
                        .comparingInt(DailyLog::getDailyPoints).reversed()
                        .thenComparingInt((DailyLog dl) -> {
                            User u = userByOpenid.get(dl.getOpenid());
                            return u != null && u.getTotalPoints() != null ? u.getTotalPoints() : 0;
                        }).reversed())
                .collect(Collectors.toList());

        // 5. Build rank list
        List<LeaderboardDTO.RankItem> rankList = new ArrayList<>();
        int myRank = 0;
        int myDailySteps = 0;

        for (int i = 0; i < sorted.size(); i++) {
            DailyLog dl = sorted.get(i);
            User u = userByOpenid.getOrDefault(dl.getOpenid(), new User());

            // Compute today's difficulty deltas for this entry
            LocalDate yesterday = date.minusDays(1);
            DailyLog prevLog = dailyLogMapper.selectByOpenidAndDate(dl.getOpenid(), yesterday);
            int prevEasy   = prevLog != null ? prevLog.getEasyCount()   : 0;
            int prevMedium = prevLog != null ? prevLog.getMediumCount() : 0;
            int prevHard   = prevLog != null ? prevLog.getHardCount()   : 0;

            LeaderboardDTO.DifficultyDetails details = new LeaderboardDTO.DifficultyDetails();
            details.setEasyAdded(Math.max(0, dl.getEasyCount()   - prevEasy));
            details.setMediumAdded(Math.max(0, dl.getMediumCount() - prevMedium));
            details.setHardAdded(Math.max(0, dl.getHardCount()   - prevHard));

            LeaderboardDTO.RankItem item = new LeaderboardDTO.RankItem();
            item.setRank(i + 1);
            item.setOpenid(dl.getOpenid());
            item.setNickname(u.getNickname());
            item.setAvatarUrl(u.getAvatarUrl());
            item.setDailyPoints(dl.getDailyPoints());
            item.setDetails(details);
            item.setTotalPoints(u.getTotalPoints() != null ? u.getTotalPoints() : 0);
            item.setTopThree(i < 3);

            rankList.add(item);

            if (dl.getOpenid().equals(openid)) {
                myRank = i + 1;
                myDailySteps = dl.getDailySteps();
            }
        }

        // 6. Calculate rank change for the requesting user
        String rankChange = calculateRankChange(openid, myRank, date);

        // 7. Build mySummary
        LeaderboardDTO.MySummary mySummary = new LeaderboardDTO.MySummary();
        mySummary.setMyRank(myRank);
        mySummary.setMyDailySteps(myDailySteps);
        mySummary.setRankChange(rankChange);

        // 8. Assemble the full response
        LeaderboardDTO.LeaderboardResponse response = new LeaderboardDTO.LeaderboardResponse();
        response.setSquadName(squad.getSquadName());
        response.setSettleTime(date);
        response.setTotalMembers(squadUsers.size());
        response.setMySummary(mySummary);
        response.setRankList(rankList);

        return response;
    }

    /**
     * Determine the requesting user's rank change by comparing T-1 and T-2 ranks.
     *
     * @param openid      the user's openid
     * @param currentRank the user's rank today (T)
     * @param date        today's date (T)
     * @return "up" if rank improved, "down" if rank worsened, "keep" otherwise
     */
    private String calculateRankChange(String openid, int currentRank, LocalDate date) {
        if (currentRank == 0) {
            return "keep";
        }

        LocalDate t1 = date.minusDays(1);
        LocalDate t2 = date.minusDays(2);

        DailyLog t1Log = dailyLogMapper.selectByOpenidAndDate(openid, t1);
        if (t1Log == null) {
            return "keep";
        }

        // Find which squad this user belongs to
        User user = userMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<User>()
                        .eq("openid", openid));
        if (user == null || user.getSquadId() == null) {
            return "keep";
        }
        Long squadId = user.getSquadId();

        // Compute T-1 rank
        List<DailyLog> t1Logs = dailyLogMapper.selectBySquadAndDate(squadId, t1);
        int t1Rank = getRankFromLogs(openid, t1Logs, squadId, t1);

        if (t1Rank == 0) {
            return "keep";
        }

        // Compute T-2 rank
        List<DailyLog> t2Logs = dailyLogMapper.selectBySquadAndDate(squadId, t2);
        int t2Rank = getRankFromLogs(openid, t2Logs, squadId, t2);

        if (t2Rank == 0) {
            return "keep";
        }

        // Lower rank number = better position
        if (t1Rank < t2Rank) {
            return "up";
        } else if (t1Rank > t2Rank) {
            return "down";
        } else {
            return "keep";
        }
    }

    /**
     * Given a list of daily logs for a squad on a date, find the 1-based rank of the user.
     * Sorts by daily_points desc, total_points desc (same logic as the main leaderboard).
     */
    private int getRankFromLogs(String openid, List<DailyLog> logs, Long squadId, LocalDate date) {
        List<User> squadUsers = userMapper.selectBySquadId(squadId);
        Map<String, User> userByOpenid = squadUsers.stream()
                .collect(Collectors.toMap(User::getOpenid, u -> u));

        List<DailyLog> sorted = logs.stream()
                .sorted(Comparator
                        .comparingInt(DailyLog::getDailyPoints).reversed()
                        .thenComparingInt((DailyLog dl) -> {
                            User u = userByOpenid.get(dl.getOpenid());
                            return u != null && u.getTotalPoints() != null ? u.getTotalPoints() : 0;
                        }).reversed())
                .collect(Collectors.toList());

        for (int i = 0; i < sorted.size(); i++) {
            if (sorted.get(i).getOpenid().equals(openid)) {
                return i + 1;
            }
        }
        return 0;
    }
}
