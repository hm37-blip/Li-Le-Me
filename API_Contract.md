package com.lilema.controller;

import com.lilema.common.Result;
import org.springframework.web.bind.annotation.*;

/**
 * @author Cici (Integrated by Wendy)
 * UserController: 处理“我是谁”与“我在哪”的账号及社交逻辑
 */
@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    /**
     * 1. 微信授权登录
     * 逻辑：通过 js_code 换取 openid，判断用户注册进度
     */
    @PostMapping("/login")
    public Result<?> login(@RequestBody String jsCode) {
        // TODO: 调用微信 API 换取 openid
        // 返回字段需包含：openid, token, registration_status (0, 1, 2)
        return Result.success("Login Success");
    }

    /**
     * 2. 设置/更新个人资料
     * 逻辑：上传昵称和微信云存储的头像 ID
     */
    @PostMapping("/profile/update")
    public Result<?> updateProfile(@RequestBody Object profileData) {
        // TODO: 更新 nickname 和 avatar_file_id
        return Result.success(true);
    }

    /**
     * 3. LeetCode 账号绑定
     * 逻辑：校验 LC ID 有效性并建立绑定关系
     * 注意：需符合 3-30位，字母/数字/下划线正则
     */
    @PostMapping("/bind")
    public Result<?> bindLeetCode(@RequestParam String openid, @RequestParam String lcUsername) {
        // TODO: 实时校验 LC ID 存在性
        return Result.success(true);
    }

    /**
     * 4. 战队加入 (验证邀请码)
     * 逻辑：输入邀请码加入指定战队
     */
    @PostMapping("/squad/join")
    public Result<?> joinSquad(@RequestParam String openid, @RequestParam String inviteCode) {
        // TODO: 校验邀请码有效性及战队人数上限
        return Result.success("Joined Squad Success");
    }

    /**
     * 5. 销号处理
     * 逻辑：彻底删除用户信息及战队关联
     */
    @DeleteMapping("/account")
    public Result<?> deleteAccount(@RequestParam String openid) {
        // TODO: 级联删除数据及退队处理
        return Result.success(true);
    }
}
