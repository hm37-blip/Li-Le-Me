package com.lilema.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

public class LeaderboardDTO {

    /**
     * Top-level response for the daily leaderboard endpoint.
     */
    @Data
    public static class LeaderboardResponse {
        /** Name of the squad */
        private String squadName;
        /** The date this leaderboard is for */
        private LocalDate settleTime;
        /** Total number of members in the squad */
        private int totalMembers;
        /** Summary information for the requesting user */
        private MySummary mySummary;
        /** Ranked list of all squad members for the day */
        private List<RankItem> rankList;
    }

    /**
     * Summary data for the requesting user.
     */
    @Data
    public static class MySummary {
        /** Rank of the requesting user today (1-based) */
        private int myRank;
        /** Number of problems the user solved today */
        private int myDailySteps;
        /** Rank change relative to yesterday: "up", "down", or "keep" */
        private String rankChange;
    }

    /**
     * A single entry in the ranked list.
     */
    @Data
    public static class RankItem {
        /** 1-based rank for today */
        private int rank;
        private String openid;
        private String nickname;
        private String avatarUrl;
        /** Points earned today */
        private int dailyPoints;
        /** Breakdown of today's additions by difficulty */
        private DifficultyDetails details;
        /** All-time accumulated points */
        private int totalPoints;
        /** Daily rank tier, e.g. Hardcore, Top Tier, Elite, NPC, Completed */
        private String rankTier;
        /** True if rank <= 3 */
        private boolean isTopThree;
    }

    /**
     * Today's additions broken down by difficulty.
     */
    @Data
    public static class DifficultyDetails {
        private int easyAdded;
        private int mediumAdded;
        private int hardAdded;
    }
}
