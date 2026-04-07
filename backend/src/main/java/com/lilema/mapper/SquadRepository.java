package com.lilema.mapper;

import com.lilema.entity.po.Squad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SquadRepository extends JpaRepository<Squad, Long> {

    Optional<Squad> findByInviteCode(String inviteCode);

    Optional<Squad> findBySquadName(String squadName);
}
