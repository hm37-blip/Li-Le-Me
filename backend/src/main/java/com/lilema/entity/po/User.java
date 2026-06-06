package com.lilema.entity.po;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String openid;

    @TableField("lc_id")
    private String lcId;

    private String nickname;

    @TableField("avatar_url")
    private String avatarUrl;

    private Integer totalSolved;

    private Integer totalPoints;

    private Integer dailySteps;

    private Long squadId;

    @TableField("registration_status")
    private Integer registrationStatus;

    @TableField("token")
    private String token;

    private LocalDateTime lastUpdate;

    private LocalDateTime createdAt;
}
