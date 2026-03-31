package com.cesa.lilema.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("daily_logs")
public class DailyLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String openid;

    private LocalDate logDate;

    /** Cumulative total solved at end of day */
    private Integer totalSolved;

    /** Problems solved today (delta) */
    private Integer dailySteps;

    /** Cumulative easy problems solved */
    private Integer easyCount;

    /** Cumulative medium problems solved */
    private Integer mediumCount;

    /** Cumulative hard problems solved */
    private Integer hardCount;

    /** Points earned today: easy_added*1 + medium_added*2 + hard_added*3 */
    private Integer dailyPoints;

    private LocalDateTime createdAt;

    private String rankTier;
}
