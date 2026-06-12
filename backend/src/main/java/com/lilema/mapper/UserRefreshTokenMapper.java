package com.lilema.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lilema.entity.po.UserRefreshToken;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserRefreshTokenMapper extends BaseMapper<UserRefreshToken> {
}
