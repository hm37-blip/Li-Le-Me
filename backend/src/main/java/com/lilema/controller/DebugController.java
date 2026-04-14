package com.lilema.controller;

import com.lilema.dto.ApiResponse;
import com.lilema.dto.LcUserStats;
import com.lilema.entity.po.DailyLog;
import com.lilema.entity.po.User;
import com.lilema.mapper.DailyLogMapper;
import com.lilema.mapper.UserMapper;
import com.lilema.service.DailySettleJob;
import com.lilema.service.LcEngineService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 临时调试接口 —— 仅在非 prod 环境可用，上线前删除
 */
@Slf4j
@RestController
@RequestMapping("/debug")
@RequiredArgsConstructor
@Profile("!prod")
public class DebugController {

    private final LcEngineService lcEngineService;
    private final DailySettleJob dailySettleJob;
    private final UserMapper userMapper;
    private final DailyLogMapper dailyLogMapper;

    /** 直接爬取指定 LC 用户名的实时数据，不写库 */
    @GetMapping("/lc/{username}")
    public ApiResponse<LcUserStats> fetchLc(@PathVariable String username) {
        try {
            LcUserStats stats = lcEngineService.fetchStats(username);
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    /** 手动触发一次结算（等同于 22:00 自动触发） */
    @PostMapping("/settle")
    public ApiResponse<String> triggerSettle() {
        try {
            dailySettleJob.settle();
            return ApiResponse.success("结算完成，查 /debug/logs 看结果");
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    /** 查看数据库里所有用户当前状态 */
    @GetMapping("/users")
    public ApiResponse<List<User>> users() {
        return ApiResponse.success(userMapper.selectList(null));
    }

    /** 查看某个用户的所有历史结算记录 */
    @GetMapping("/logs/{openid}")
    public ApiResponse<List<DailyLog>> logs(@PathVariable String openid) {
        List<DailyLog> logs = dailyLogMapper.selectList(
                new QueryWrapper<DailyLog>().eq("openid", openid).orderByDesc("log_date"));
        return ApiResponse.success(logs);
    }
}
