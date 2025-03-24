package com.nova.service;

import com.nova.entity.*;
import com.nova.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private OtpService otpService;

    @Autowired
    private PdfGeneratorService pdfGeneratorService; 

    @Autowired
    private EmailService emailService; 

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

        // Removed the active plan check to allow multiple recharges
        // Optional<Recharge> activeRechargeOptional = rechargeRepository.findActiveRechargeByUserId(userId);
        // if (activeRechargeOptional.isPresent()) {
        //     throw new Exception("You already have an active plan");
        // }

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
        invoice = invoiceRepository.save(invoice);

        // Send SMS notification after successful recharge
        String smsMessage = String.format(
            "Dear %s, your recharge of ₹%.2f for plan '%s' on number %s has been successful. Transaction ID: %d. Valid until: %s. Thank you for choosing Nova!",
            user.getFirstName() + " " + user.getLastName(),
            plan.getPrice(),
            plan.getName(),
            phoneNumber,
            transaction.getTransactionId(),
            recharge.getEndDate().toString()
        );
        try {
            otpService.sendSms(phoneNumber, smsMessage);
        } catch (Exception e) {
            System.err.println("Failed to send SMS: " + e.getMessage());
        }

        // Generate invoice PDF and send via email
        Map<String, Object> invoiceData = new HashMap<>();
        invoiceData.put("invoiceId", invoice.getInvoiceId());
        invoiceData.put("transactionId", transaction.getTransactionId());
        invoiceData.put("userName", user.getFirstName() + " " + user.getLastName());
        invoiceData.put("phoneNumber", recharge.getPhoneNumber());
        invoiceData.put("planName", plan.getName());
        invoiceData.put("planPrice", plan.getPrice());
        invoiceData.put("gst", invoice.getGst());
        invoiceData.put("totalAmount", invoice.getTotalAmount());
        invoiceData.put("transactionDate", invoice.getTransactionDate().toString());
        invoiceData.put("paymentMode", invoice.getPaymentMode());

        try {
            // Generate PDF
            ByteArrayOutputStream pdfStream = pdfGeneratorService.generateInvoice(invoiceData);
            byte[] pdfBytes = pdfStream.toByteArray();

            // Prepare email content
            String emailSubject = "Your Nova Recharge Invoice - Transaction ID: " + transaction.getTransactionId();
            String emailBody = String.format(
                "<h2>Dear %s,</h2>" +
                "<p>Thank you for recharging with Nova! Your recharge has been successfully processed. Below are the details:</p>" +
                "<ul>" +
                "<li><strong>Transaction ID:</strong> %d</li>" +
                "<li><strong>Plan:</strong> %s</li>" +
                "<li><strong>Amount:</strong> ₹%.2f (including GST)</li>" +
                "<li><strong>Phone Number:</strong> %s</li>" +
                "<li><strong>Valid Until:</strong> %s</li>" +
                "</ul>" +
                "<p>Please find the invoice attached for your records.</p>" +
                "<p>For any assistance, feel free to contact us at support@nova.com or +91 9876543210.</p>" +
                "<p>Best regards,<br>The Nova Team</p>",
                user.getFirstName() + " " + user.getLastName(),
                transaction.getTransactionId(),
                plan.getName(),
                invoice.getTotalAmount(),
                phoneNumber,
                recharge.getEndDate().toString()
            );

            // Send email with PDF attachment
            emailService.sendEmailWithAttachment(
                user.getEmail(),
                emailSubject,
                emailBody,
                pdfBytes,
                "Nova_Invoice_" + transaction.getTransactionId() + ".pdf"
            );
        } catch (Exception e) {
            System.err.println("Failed to send invoice email: " + e.getMessage());
        }

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