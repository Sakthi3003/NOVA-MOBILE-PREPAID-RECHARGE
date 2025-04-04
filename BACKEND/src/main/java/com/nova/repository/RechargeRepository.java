package com.nova.repository;

import com.nova.entity.Recharge;
import com.nova.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RechargeRepository extends JpaRepository<Recharge, Long> {
    @Query("SELECT r FROM Recharge r WHERE r.user.userId = :userId AND r.status = 'Active' AND r.endDate >= CURRENT_DATE")
    Optional<Recharge> findActiveRechargeByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM Recharge r WHERE r.user.userId = :userId AND (r.status = 'Expired' OR r.endDate < CURRENT_DATE)")
    List<Recharge> findPreviousRechargesByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM Recharge r WHERE r.user.userId = :userId")
    List<Recharge> findByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM Recharge r WHERE r.transactionId = :transactionId")
    Optional<Recharge> findByTransactionId(@Param("transactionId") Long transactionId);
    
    List<Recharge> findByEndDateBetween(LocalDate start, LocalDate end);
    List<Recharge> findByUserUserId(Long userId);
    
    Optional<Recharge> findTopByUserOrderByStartDateDescRechargeIdDesc(User user);
    
    List<Recharge> findByUser(User user);
}