package com.cesa.lilema.entity;

import com.baomidou.mybatisplus.annotation.IdType;
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

    private String lcId;

    private String nickname;

    private String avatarUrl;

    private Integer totalSolved;

    private Integer totalPoints;

    private Integer dailySteps;

    private Long squadId;

    private LocalDateTime lastUpdate;

    private LocalDateTime createdAt;
}
