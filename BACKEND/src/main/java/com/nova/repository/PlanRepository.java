package com.nova.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nova.entity.Plan;

import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByCategoryId(Long categoryId);
    
    @Query("SELECT p FROM Plan p WHERE " +
            "UPPER(p.name) LIKE UPPER(CONCAT('%', :query, '%')) OR " +
            "CAST(p.price AS string) LIKE CONCAT('%', :query, '%') OR " +
            "UPPER(p.validity) LIKE UPPER(CONCAT('%', :query, '%')) OR " +
            "UPPER(p.data) LIKE UPPER(CONCAT('%', :query, '%')) OR " +
            "UPPER(p.sms) LIKE UPPER(CONCAT('%', :query, '%')) OR " +
            "UPPER(p.calls) LIKE UPPER(CONCAT('%', :query, '%')) OR " +
            "UPPER(p.benefit1) LIKE UPPER(CONCAT('%', :query, '%')) OR " +
            "UPPER(p.benefit2) LIKE UPPER(CONCAT('%', :query, '%')) " +
            "AND p.status = 'active'")
     List<Plan> searchPlans(@Param("query") String query);
}