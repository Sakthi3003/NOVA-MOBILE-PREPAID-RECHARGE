package com.nova.service;

import com.nova.entity.*;
import com.nova.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * Processes a new recharge for a user, setting the activation date of pending plans
     * sequentially based on the end date of the last active or pending plan.
     */
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

        // Determine recharge status and start date
        String rechargeStatus;
        LocalDate startDate;
        LocalDate endDate;

        // Fetch all relevant recharges (Active with end date after today or Pending)
        List<Recharge> relevantRecharges = rechargeRepository.findByUserId(userId)
                .stream()
                .filter(r -> ("Active".equals(r.getStatus()) && r.getEndDate().isAfter(LocalDate.now())) ||
                             "Pending".equals(r.getStatus()))
                .toList();

        if ("data".equalsIgnoreCase(plan.getCategory().getName())) {
            // Data plans are activated immediately
            rechargeStatus = "Active";
            startDate = LocalDate.now();
        } else if (relevantRecharges.isEmpty()) {
            // No active or pending recharges, activate immediately
            rechargeStatus = "Active";
            startDate = LocalDate.now();
        } else {
            // Set as Pending and calculate start date as the day after the latest end date
            rechargeStatus = "Pending";
            LocalDate latestEndDate = relevantRecharges.stream()
                    .map(Recharge::getEndDate)
                    .max(LocalDate::compareTo)
                    .orElse(LocalDate.now());
            startDate = latestEndDate.plusDays(1);
        }
        // Calculate end date based on start date and plan validity
        endDate = startDate.plusDays(Long.parseLong(plan.getValidity().split(" ")[0]));

        // Create recharge
        Recharge recharge = new Recharge();
        recharge.setUser(user);
        recharge.setPlan(plan);
        recharge.setPhoneNumber(phoneNumber);
        recharge.setStartDate(startDate);
        recharge.setEndDate(endDate);
        recharge.setStatus(rechargeStatus);
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

        // Send SMS notification
        String smsMessage = String.format(
            "Dear %s, your recharge of ₹%.2f for plan '%s' on number %s has been %s. Transaction ID: %d. Valid from: %s to %s. Thank you for choosing Nova!",
            user.getFirstName() + " " + user.getLastName(),
            plan.getPrice(),
            plan.getName(),
            phoneNumber,
            rechargeStatus.equals("Active") ? "successful" : "queued",
            transaction.getTransactionId(),
            recharge.getStartDate().toString(),
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
        invoiceData.put("status", rechargeStatus);
        invoiceData.put("startDate", recharge.getStartDate().toString());
        invoiceData.put("endDate", recharge.getEndDate().toString());

        try {
            ByteArrayOutputStream pdfStream = pdfGeneratorService.generateInvoice(invoiceData);
            byte[] pdfBytes = pdfStream.toByteArray();

            String emailSubject = "Your Nova Recharge Invoice - Transaction ID: " + transaction.getTransactionId();
            String emailBody = String.format(
                "<h2>Dear %s,</h2>" +
                "<p>Thank you for recharging with Nova! Your recharge has been %s. Below are the details:</p>" +
                "<ul>" +
                "<li><strong>Transaction ID:</strong> %d</li>" +
                "<li><strong>Plan:</strong> %s</li>" +
                "<li><strong>Amount:</strong> ₹%.2f (including GST)</li>" +
                "<li><strong>Phone Number:</strong> %s</li>" +
                "<li><strong>Status:</strong> %s</li>" +
                "<li><strong>Valid From:</strong> %s</li>" +
                "<li><strong>Valid Until:</strong> %s</li>" +
                "</ul>" +
                "<p>Please find the invoice attached for your records.</p>" +
                "<p>For any assistance, feel free to contact us at support@nova.com or +91 9876543210.</p>" +
                "<p>Best regards,<br>The Nova Team</p>",
                user.getFirstName() + " " + user.getLastName(),
                rechargeStatus.equals("Active") ? "successfully processed" : "queued for activation",
                transaction.getTransactionId(),
                plan.getName(),
                invoice.getTotalAmount(),
                phoneNumber,
                rechargeStatus,
                recharge.getStartDate().toString(),
                recharge.getEndDate().toString()
            );

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

    /**
     * Simulates payment processing (for demonstration purposes).
     */
    private boolean simulatePayment(Long userId, double amount, String paymentMethod) {
        return Math.random() > 0.1; // 90% success rate
    }

    /**
     * Scheduled task to update recharge statuses daily at midnight.
     */
    @Transactional
    @Scheduled(cron = "0 0 0 * * *") // Run at midnight every day
    public void updateRechargeStatuses() {
        LocalDate today = LocalDate.now();
        System.out.println("Running updateRechargeStatuses task at " + LocalDateTime.now() + " for date: " + today);

        // Step 1: Mark expired recharges
        List<Recharge> activeRecharges = rechargeRepository.findAll();
        System.out.println("Total recharges found: " + activeRecharges.size());

        List<Recharge> toBeExpired = activeRecharges.stream()
                .filter(r -> "Active".equals(r.getStatus()) && r.getEndDate().isBefore(today))
                .toList();

        System.out.println("Recharges to be marked as Expired: " + toBeExpired.size());
        for (Recharge recharge : toBeExpired) {
            System.out.println("Marking recharge " + recharge.getRechargeId() + " as Expired (endDate: " + recharge.getEndDate() + ")");
            recharge.setStatus("Expired");
            rechargeRepository.save(recharge);
            notifyUserAboutExpiration(recharge);
        }

        // Step 2: Activate pending recharges if no active plans remain
        List<Recharge> pendingRecharges = activeRecharges.stream()
                .filter(r -> "Pending".equals(r.getStatus()) && !r.getStartDate().isAfter(today))
                .toList();

        System.out.println("Pending recharges to check: " + pendingRecharges.size());
        for (Recharge recharge : pendingRecharges) {
            List<Recharge> activeForUser = rechargeRepository.findByUserId(recharge.getUser().getUserId())
                    .stream()
                    .filter(r -> "Active".equals(r.getStatus()) && r.getEndDate().isAfter(today))
                    .toList();

            System.out.println("Active recharges for user " + recharge.getUser().getUserId() + ": " + activeForUser.size());
            if (activeForUser.isEmpty()) {
                System.out.println("Activating pending recharge " + recharge.getRechargeId() + " for user " + recharge.getUser().getUserId());
                recharge.setStatus("Active");
                rechargeRepository.save(recharge);
                notifyUserAboutActivation(recharge);
            }
        }
    }

    /**
     * Notifies the user when a recharge expires.
     */
    private void notifyUserAboutExpiration(Recharge recharge) {
        String smsMessage = String.format(
            "Dear %s, your plan '%s' for number %s has expired on %s. Recharge now to stay connected!",
            recharge.getUser().getFirstName(),
            recharge.getPlan().getName(),
            recharge.getPhoneNumber(),
            recharge.getEndDate().toString()
        );
        try {
            otpService.sendSms(recharge.getPhoneNumber(), smsMessage);
        } catch (Exception e) {
            System.err.println("Failed to send expiration SMS: " + e.getMessage());
        }
    }

    /**
     * Notifies the user when a pending recharge is activated.
     */
    private void notifyUserAboutActivation(Recharge recharge) {
        String smsMessage = String.format(
            "Dear %s, your queued plan '%s' for number %s is now active. Valid until %s. Enjoy!",
            recharge.getUser().getFirstName(),
            recharge.getPlan().getName(),
            recharge.getPhoneNumber(),
            recharge.getEndDate().toString()
        );
        try {
            otpService.sendSms(recharge.getPhoneNumber(), smsMessage);
        } catch (Exception e) {
            System.err.println("Failed to send activation SMS: " + e.getMessage());
        }
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