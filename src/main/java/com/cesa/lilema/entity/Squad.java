package com.cesa.lilema.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("squads")
public class Squad {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String squadName;

    private String inviteCode;

    private String adminOpenid;

    private Integer maxMembers;

    private Integer memberCount;

    private Boolean isActive;

    private LocalDateTime createdAt;
}
