package com.cesa.lilema.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cesa.lilema.entity.DailyLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface DailyLogMapper extends BaseMapper<DailyLog> {

    /**
     * Select all daily logs for a given squad on a given date.
     * Joins daily_logs with users to filter by squad_id.
     *
     * @param squadId the squad ID
     * @param date    the log date
     * @return list of daily logs
     */
    List<DailyLog> selectBySquadAndDate(@Param("squadId") Long squadId, @Param("date") LocalDate date);

    /**
     * Select the daily log for a specific user on a specific date.
     *
     * @param openid the user's WeChat openid
     * @param date   the log date
     * @return the daily log, or null if not found
     */
    DailyLog selectByOpenidAndDate(@Param("openid") String openid, @Param("date") LocalDate date);
}
