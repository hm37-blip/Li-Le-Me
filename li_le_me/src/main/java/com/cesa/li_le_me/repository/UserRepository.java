package com.cesa.li_le_me.repository;

import com.cesa.li_le_me.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByOpenid(String openid);

    Optional<User> findByLeetcodeUsernameIgnoreCase(String leetcodeUsername);

    Optional<User> findByToken(String token);

    long countBySquadId(Long squadId);

    java.util.List<User> findBySquadId(Long squadId);
}
