package com.nova.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.nova.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findByUsername(String username);
	
	Optional<User> findByPhoneNumber(String email);

	Optional<User> findByEmail(String email);
	
	@Query("SELECT u FROM User u LEFT JOIN FETCH u.recharges r LEFT JOIN FETCH u.transactions t LEFT JOIN FETCH u.invoices i WHERE u.userId = :userId")
    Optional<User> findUserWithDetails(Long userId);

}