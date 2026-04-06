package com.cesa.li_le_me.repository;

import com.cesa.li_le_me.entity.Squad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SquadRepository extends JpaRepository<Squad, Long> {

    Optional<Squad> findByInviteCode(String inviteCode);

    Optional<Squad> findBySquadName(String squadName);
}
