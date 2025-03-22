package com.nova.repository;

import com.nova.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    @Query("SELECT i FROM Invoice i WHERE i.user.userId = :userId")
    List<Invoice> findByUserId(Long userId);

    @Query("SELECT i FROM Invoice i WHERE i.transactionId = :transactionId")
    Optional<Invoice> findByTransactionId(Long transactionId);
}