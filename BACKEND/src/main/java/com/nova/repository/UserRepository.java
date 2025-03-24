package com.nova.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nova.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findByUsername(String username);
	
	Optional<User> findByPhoneNumber(String email);

	Optional<User> findByEmail(String email);
	
	@Query("SELECT u FROM User u LEFT JOIN FETCH u.recharges r LEFT JOIN FETCH u.transactions t LEFT JOIN FETCH u.invoices i WHERE u.userId = :userId")
    Optional<User> findUserWithDetails(Long userId);
	
	List<User> findByStatus(String status);

    @Query("SELECT u FROM User u WHERE u.status = 'deactivated' AND u.phoneNumber IS NULL")
    List<User> findDeactivatedUsersWithoutPhoneNumber();

    @Query("SELECT u FROM User u " +
            "WHERE (:status IS NULL OR :status = '' OR LOWER(COALESCE(u.status, '')) = LOWER(:status)) " +
            "AND (:search IS NULL OR :search = '' " +
            "OR LOWER(COALESCE(u.firstName, '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(u.lastName, '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(u.phoneNumber, '')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND NOT EXISTS (SELECT r FROM u.roles r WHERE r.name = 'ADMIN')")
     Page<User> findBySearchAndStatus(
             @Param("search") String search,
             @Param("status") String status,
             Pageable pageable
     );

}