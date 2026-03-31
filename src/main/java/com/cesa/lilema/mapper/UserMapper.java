package com.cesa.lilema.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cesa.lilema.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * Select all users belonging to a specific squad.
     *
     * @param squadId the squad ID
     * @return list of users in the squad
     */
    List<User> selectBySquadId(@Param("squadId") Long squadId);

    /**
     * Select all users who have a bound LeetCode account.
     * Used by the daily settle job.
     *
     * @return list of users with a non-null, non-empty lc_id
     */
    List<User> selectAllWithLcId();
}
