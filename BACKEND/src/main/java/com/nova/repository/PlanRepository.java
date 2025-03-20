package com.nova.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nova.entity.Plan;

import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByCategoryId(Long categoryId);
    
    @Query("SELECT p FROM Plan p WHERE " +
            "(:search IS NULL OR " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.category.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "CAST(p.price AS string) LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(p.validity) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.data) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.sms) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.calls) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.benefit1) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.benefit2) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:status IS NULL OR p.status = :status)")
     Page<Plan> findAllWithSearch(@Param("search") String search, @Param("status") String status, Pageable pageable);
}