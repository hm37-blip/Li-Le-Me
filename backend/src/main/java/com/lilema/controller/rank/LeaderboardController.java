package com.lilema.controller.rank;

import com.lilema.dto.ApiResponse;
import com.lilema.dto.LeaderboardDTO;
import com.lilema.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/v1/rank")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    /**
     * GET /api/leaderboard/daily?squad_id=&date=&openid=
     * <p>
     * Returns the daily leaderboard for a squad.
     *
     * @param squadId the squad ID
     * @param date    the date to query (ISO format yyyy-MM-dd); defaults to today if omitted
     * @param openid  the requesting user's openid (used to populate mySummary)
     */
    @GetMapping("/daily")
    public ApiResponse<LeaderboardDTO.LeaderboardResponse> getDailyLeaderboard(
            @RequestParam("squad_id") Long squadId,
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("openid") String openid) {

        if (squadId == null) {
            return ApiResponse.error(400, "squad_id is required");
        }
        if (openid == null || openid.isBlank()) {
            return ApiResponse.error(400, "openid is required");
        }
        try {
            LeaderboardDTO.LeaderboardResponse response =
                    leaderboardService.getDailyLeaderboard(squadId, openid, date);
            return ApiResponse.success(response);
        } catch (RuntimeException e) {
            log.error("Leaderboard error for squad {}: {}", squadId, e.getMessage());
            return ApiResponse.error(500, e.getMessage());
        }
    }
}
