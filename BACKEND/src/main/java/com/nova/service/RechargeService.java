package com.nova.service;

import com.nova.entity.*;
import com.nova.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RechargeService {

    @Autowired
    private RechargeRepository rechargeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    public Recharge rechargeUser(Long userId, Long planId, String phoneNumber, String paymentMethod) throws Exception {
        // Fetch user
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new Exception("User not found");
        }
        User user = userOptional.get();

        // Fetch plan
        Optional<Plan> planOptional = planRepository.findById(planId);
        if (!planOptional.isPresent()) {
            throw new Exception("Plan not found");
        }
        Plan plan = planOptional.get();

        // Check for active plan
        Optional<Recharge> activeRechargeOptional = rechargeRepository.findActiveRechargeByUserId(userId);
        if (activeRechargeOptional.isPresent()) {
            throw new Exception("You already have an active plan");
        }

        // Simulate payment processing
        boolean paymentSuccessful = simulatePayment(userId, plan.getPrice(), paymentMethod);
        if (!paymentSuccessful) {
            throw new Exception("Payment failed");
        }

        // Create transaction
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAmount(plan.getPrice());
        transaction.setPaymentMethod(paymentMethod);
        transaction.setStatus("Completed");
        transaction.setCreatedAt(LocalDateTime.now());
        transaction = transactionRepository.save(transaction);

        // Create recharge
        Recharge recharge = new Recharge();
        recharge.setUser(user);
        recharge.setPlan(plan);
        recharge.setPhoneNumber(phoneNumber);
        recharge.setStartDate(LocalDate.now());
        recharge.setEndDate(LocalDate.now().plusDays(Long.parseLong(plan.getValidity().split(" ")[0])));
        recharge.setStatus("Active");
        recharge.setTransactionId(transaction.getTransactionId());
        recharge = rechargeRepository.save(recharge);

        // Create invoice
        Invoice invoice = new Invoice();
        invoice.setUser(user);
        invoice.setTransactionId(transaction.getTransactionId());
        invoice.setTotalAmount(plan.getPrice());
        invoice.setGst(plan.getPrice() * 0.18); // 18% GST
        invoice.setTransactionDate(LocalDateTime.now());
        invoice.setPaymentMode(paymentMethod);
        invoiceRepository.save(invoice);

        return recharge;
    }

    private boolean simulatePayment(Long userId, double amount, String paymentMethod) {
        // Simulate payment success/failure (e.g., 90% success rate)
        return Math.random() > 0.1;
    }

    public Optional<Recharge> findActiveRechargeByUserId(Long userId) {
        return rechargeRepository.findActiveRechargeByUserId(userId);
    }

    public List<Recharge> findPreviousRechargesByUserId(Long userId) {
        return rechargeRepository.findPreviousRechargesByUserId(userId);
    }

    public List<Recharge> findRechargesByUserId(Long userId) {
        return rechargeRepository.findByUserId(userId);
    }

    public List<Transaction> findTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    public List<Invoice> findInvoicesByUserId(Long userId) {
        return invoiceRepository.findByUserId(userId);
    }

    public Optional<Recharge> findRechargeByTransactionId(Long transactionId) {
        return rechargeRepository.findByTransactionId(transactionId);
    }

    public Optional<Invoice> findInvoiceByTransactionId(Long transactionId) {
        return invoiceRepository.findByTransactionId(transactionId);
    }
}