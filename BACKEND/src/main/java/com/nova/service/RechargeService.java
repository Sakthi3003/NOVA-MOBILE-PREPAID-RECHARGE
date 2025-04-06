package com.nova.service;

import com.nova.DTO.PlanDTO;
import com.nova.DTO.RechargeDTO;
import com.nova.DTO.RechargeStatusResponse;
import com.nova.DTO.TransactionDTO;
import com.nova.DTO.UserDTO;
import com.nova.entity.*;
import com.nova.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RechargeService {

    private static final Logger logger = LoggerFactory.getLogger(RechargeService.class);

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
    private TwillioService otpService;

    @Autowired
    private PdfGeneratorService pdfGeneratorService;

    @Autowired
    private EmailService emailService;

    public Map<String, Object> processRecharge(Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            Long planId = Long.parseLong(request.get("planId").toString());
            String phoneNumber = request.get("phoneNumber").toString();
            String paymentMethod = request.get("paymentMethod").toString();

            Recharge recharge = rechargeUser(userId, planId, phoneNumber, paymentMethod);

            response.put("status", "Success");
            response.put("transactionId", recharge.getTransactionId());
            response.put("rechargeStatus", recharge.getStatus());
            response.put("message", "Recharge " + (recharge.getStatus().equals("Active") ? "successful" : "queued"));
            response.put("startDate", recharge.getStartDate().toString());
            response.put("endDate", recharge.getEndDate().toString());
        } catch (Exception e) {
            response.put("status", "Error");
            response.put("message", "Failed to process recharge: " + e.getMessage());
        }
        return response;
    }

    public Recharge rechargeUser(Long userId, Long planId, String phoneNumber, String paymentMethod) throws Exception {
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new Exception("User not found");
        }
        User user = userOptional.get();

        Optional<Plan> planOptional = planRepository.findById(planId);
        if (!planOptional.isPresent()) {
            throw new Exception("Plan not found");
        }
        Plan plan = planOptional.get();

        boolean paymentSuccessful = simulatePayment(userId, plan.getPrice(), paymentMethod);
        if (!paymentSuccessful) {
            throw new Exception("Payment failed");
        }

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAmount(plan.getPrice());
        transaction.setPaymentMethod(paymentMethod);
        transaction.setStatus("Completed");
        transaction.setCreatedAt(LocalDateTime.now());
        transaction = transactionRepository.save(transaction);

        String rechargeStatus;
        LocalDate startDate;
        LocalDate endDate;

        List<Recharge> relevantRecharges = rechargeRepository.findByUserId(userId)
                .stream()
                .filter(r -> ("Active".equals(r.getStatus()) && r.getEndDate().isAfter(LocalDate.now())) ||
                        "Pending".equals(r.getStatus()))
                .toList();

        if ("data".equalsIgnoreCase(plan.getCategory().getName())) {
            rechargeStatus = "Active";
            startDate = LocalDate.now();
        } else if (relevantRecharges.isEmpty()) {
            rechargeStatus = "Active";
            startDate = LocalDate.now();
        } else {
            rechargeStatus = "Pending";
            LocalDate latestEndDate = relevantRecharges.stream()
                    .map(Recharge::getEndDate)
                    .max(LocalDate::compareTo)
                    .orElse(LocalDate.now());
            startDate = latestEndDate.plusDays(1);
        }
        endDate = startDate.plusDays(Long.parseLong(plan.getValidity().split(" ")[0]));

        Recharge recharge = new Recharge();
        recharge.setUser(user);
        recharge.setPlan(plan);
        recharge.setPhoneNumber(phoneNumber);
        recharge.setStartDate(startDate);
        recharge.setEndDate(endDate);
        recharge.setStatus(rechargeStatus);
        recharge.setTransactionId(transaction.getTransactionId());
        recharge = rechargeRepository.save(recharge);

        Invoice invoice = new Invoice();
        invoice.setUser(user);
        invoice.setTransactionId(transaction.getTransactionId());
        invoice.setTotalAmount(plan.getPrice());
        invoice.setGst(plan.getPrice() * 0.18);
        invoice.setTransactionDate(LocalDateTime.now());
        invoice.setPaymentMode(paymentMethod);
        invoice = invoiceRepository.save(invoice);

        String smsMessage = String.format(
                "Dear %s, your recharge for '%s' (₹%.2f) on %s is %s. Valid: %s to %s. Txn ID: %d. Enjoy Nova!",
                user.getFirstName(),
                plan.getName(),
                plan.getPrice(),
                phoneNumber,
                rechargeStatus.equals("Active") ? "successful" : "queued",
                recharge.getStartDate().toString(),
                recharge.getEndDate().toString(),
                transaction.getTransactionId()
        );
        try {
            otpService.sendSms(phoneNumber, smsMessage);
        } catch (Exception e) {
            logger.error("Failed to send SMS: {}", e.getMessage());
        }

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
            logger.error("Failed to send invoice email: {}", e.getMessage());
        }

        return recharge;
    }

    public Map<String, Object> sendInvoiceEmail(Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String email = validateField(request, "email");
            String customerName = validateField(request, "customerName");
            String mobileNumber = validateField(request, "mobileNumber");
            String amount = validateField(request, "amount");
            String refNo = validateField(request, "refNo");
            String date = validateField(request, "date");
            String time = validateField(request, "time");
            String paymentMode = validateField(request, "paymentMode");
            String planName = validateField(request, "planName");
            String data = validateField(request, "data");
            String validity = validateField(request, "validity");
            String calls = validateField(request, "calls");
            String sms = request.get("sms") != null ? request.get("sms").toString() : "N/A";

            Double baseAmount = validateDoubleField(request, "baseAmount");
            Double gst = validateDoubleField(request, "gst");
            Double totalAmount = validateDoubleField(request, "totalAmount");

            Map<String, Object> invoiceData = new HashMap<>();
            invoiceData.put("invoiceId", refNo);
            invoiceData.put("transactionId", refNo);
            invoiceData.put("userName", customerName);
            invoiceData.put("phoneNumber", mobileNumber);
            invoiceData.put("planName", planName);
            invoiceData.put("planPrice", baseAmount);
            invoiceData.put("gst", gst);
            invoiceData.put("totalAmount", totalAmount);
            invoiceData.put("transactionDate", date + " " + time);
            invoiceData.put("paymentMode", paymentMode);
            invoiceData.put("data", data);
            invoiceData.put("validity", validity);
            invoiceData.put("calls", calls);
            invoiceData.put("sms", sms);

            ByteArrayOutputStream pdfStream = pdfGeneratorService.generateInvoice(invoiceData);
            byte[] pdfBytes = pdfStream.toByteArray();

            String emailSubject = "Your Nova Recharge Invoice - Ref No: " + refNo;
            String emailBody = String.format(
                    "<h2>Dear %s,</h2>" +
                            "<p>Thank you for recharging with Nova! Your recharge has been successfully processed. Below are the details:</p>" +
                            "<ul>" +
                            "<li><strong>Ref No:</strong> %s</li>" +
                            "<li><strong>Plan:</strong> %s</li>" +
                            "<li><strong>Amount:</strong> ₹%.2f (including GST)</li>" +
                            "<li><strong>Phone Number:</strong> %s</li>" +
                            "<li><strong>Data:</strong> %s</li>" +
                            "<li><strong>Validity:</strong> %s</li>" +
                            "<li><strong>Voice:</strong> %s</li>" +
                            (sms.equals("N/A") ? "" : "<li><strong>SMS:</strong> %s</li>") +
                            "</ul>" +
                            "<p>Please find the invoice attached for your records.</p>" +
                            "<p>For any assistance, feel free to contact us at support@nova.com or +91 9876543210.</p>" +
                            "<p>Best regards,<br>The Nova Team</p>",
                    customerName, refNo, planName, totalAmount, mobileNumber, data, validity, calls, sms.equals("N/A") ? "" : sms
            );

            emailService.sendEmailWithAttachment(
                    email, emailSubject, emailBody, pdfBytes, "Nova_Invoice_" + refNo + ".pdf"
            );

            response.put("status", "SUCCESS");
            response.put("message", "Invoice sent successfully to " + email);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Failed to send invoice email: " + e.getMessage());
        }
        return response;
    }

    private String validateField(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value == null) {
            throw new IllegalArgumentException("Missing required field: " + key);
        }
        String stringValue = value.toString();
        if (stringValue.trim().isEmpty()) {
            throw new IllegalArgumentException("Field cannot be empty: " + key);
        }
        if (key.equals("email") && !stringValue.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            throw new IllegalArgumentException("Invalid email format: " + stringValue);
        }
        return stringValue;
    }

    private Double validateDoubleField(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value == null) {
            throw new IllegalArgumentException("Missing required field: " + key);
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid numeric value for field: " + key);
        }
    }

    private boolean simulatePayment(Long userId, double amount, String paymentMethod) {
        return Math.random() > 0.1;
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * *")
    public void updateRechargeStatuses() {
        LocalDate today = LocalDate.now();
        logger.info("Running updateRechargeStatuses task at {} for date: {}", LocalDateTime.now(), today);

        List<Recharge> activeRecharges = rechargeRepository.findAll();
        logger.info("Total recharges found: {}", activeRecharges.size());

        List<Recharge> toBeExpired = activeRecharges.stream()
                .filter(r -> "Active".equals(r.getStatus()) && r.getEndDate().isBefore(today))
                .toList();

        logger.info("Recharges to be marked as Expired: {}", toBeExpired.size());
        for (Recharge recharge : toBeExpired) {
            logger.info("Marking recharge {} as Expired (endDate: {})", recharge.getRechargeId(), recharge.getEndDate());
            recharge.setStatus("Expired");
            rechargeRepository.save(recharge);
            notifyUserAboutExpiration(recharge);
        }

        List<Recharge> pendingRecharges = activeRecharges.stream()
                .filter(r -> "Pending".equals(r.getStatus()) && !r.getStartDate().isAfter(today))
                .toList();

        logger.info("Pending recharges to check: {}", pendingRecharges.size());
        for (Recharge recharge : pendingRecharges) {
            List<Recharge> activeForUser = rechargeRepository.findByUserId(recharge.getUser().getUserId())
                    .stream()
                    .filter(r -> "Active".equals(r.getStatus()) && r.getEndDate().isAfter(today))
                    .toList();

            logger.info("Active recharges for user {}: {}", recharge.getUser().getUserId(), activeForUser.size());
            if (activeForUser.isEmpty()) {
                logger.info("Activating pending recharge {} for user {}", recharge.getRechargeId(), recharge.getUser().getUserId());
                recharge.setStatus("Active");
                rechargeRepository.save(recharge);
                notifyUserAboutActivation(recharge);
            }
        }
    }

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
            logger.error("Failed to send expiration SMS: {}", e.getMessage());
        }
    }

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
            logger.error("Failed to send activation SMS: {}", e.getMessage());
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

    public List<RechargeDTO> getExpiringPlans() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);
        logger.info("Fetching recharges expiring between {} and {}", today, threeDaysFromNow);
        List<Recharge> recharges = rechargeRepository.findByEndDateBetween(today, threeDaysFromNow);
        return recharges.stream().map(this::convertToRechargeDTO).collect(Collectors.toList());
    }

    public Map<String, Object> getUserRechargesAndTransactions(Long userId) {
        logger.info("Fetching recharge and transaction details for userId: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Recharge> recharges = rechargeRepository.findByUserUserId(userId);
        List<Transaction> transactions = user.getTransactions();

        UserDTO userDTO = convertToUserDTO(user);
        RechargeDTO currentRecharge = recharges.stream()
                .filter(r -> r.getStatus().equalsIgnoreCase("active"))
                .findFirst()
                .map(this::convertToRechargeDTO)
                .orElse(null);

        List<TransactionDTO> transactionDTOs = transactions.stream()
                .map(this::convertToTransactionDTO)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("user", userDTO);
        response.put("currentRecharge", currentRecharge);
        response.put("transactions", transactionDTOs);
        return response;
    }

    @Transactional
    public RechargeStatusResponse checkRechargeStatus() {
        logger.info("Checking recharge status for all users");
        boolean updated = false;
        List<User> activeUsers = userRepository.findByStatus("active");
        List<User> inactiveUsers = userRepository.findByStatus("inactive");

        logger.info("Found {} active users and {} inactive users", activeUsers.size(), inactiveUsers.size());

        for (User user : activeUsers) {
            logger.debug("Checking active user: {}", user.getUserId());
            Optional<Recharge> latestRechargeOpt = rechargeRepository.findTopByUserOrderByStartDateDescRechargeIdDesc(user);
            if (latestRechargeOpt.isPresent()) {
                LocalDate lastRecharge = latestRechargeOpt.get().getStartDate();
                long monthsSinceLastRecharge = ChronoUnit.MONTHS.between(lastRecharge, LocalDate.now());
                logger.debug("User {} last recharge on {}, months since: {}", user.getUserId(), lastRecharge, monthsSinceLastRecharge);
                if (monthsSinceLastRecharge >= 3) {
                    user.setStatus("inactive");
                    userRepository.save(user);
                    updated = true;
                    logger.info("User {} set to inactive due to no recharge for 3+ months", user.getUserId());
                }
            } else {
                LocalDate activationDate = user.getActivationDate().toLocalDate();
                long monthsSinceActivation = ChronoUnit.MONTHS.between(activationDate, LocalDate.now());
                logger.debug("User {} activated on {}, months since: {}", user.getUserId(), activationDate, monthsSinceActivation);
                if (monthsSinceActivation >= 3) {
                    user.setStatus("inactive");
                    userRepository.save(user);
                    updated = true;
                    logger.info("User {} set to inactive due to no activity for 3+ months since activation", user.getUserId());
                }
            }
        }

        for (User inactiveUser : inactiveUsers) {
            logger.debug("Checking inactive user: {}", inactiveUser.getUserId());
            Optional<Recharge> latestRechargeOpt = rechargeRepository.findTopByUserOrderByStartDateDescRechargeIdDesc(inactiveUser);
            LocalDate lastActivityDate;
            if (latestRechargeOpt.isPresent()) {
                lastActivityDate = latestRechargeOpt.get().getStartDate();
                logger.debug("User {} last recharge on {}", inactiveUser.getUserId(), lastActivityDate);
            } else {
                lastActivityDate = inactiveUser.getActivationDate().toLocalDate();
                logger.debug("User {} activated on {}", inactiveUser.getUserId(), lastActivityDate);
            }
            long monthsSinceLastActivity = ChronoUnit.MONTHS.between(lastActivityDate, LocalDate.now());
            logger.debug("User {} months since last activity: {}", inactiveUser.getUserId(), monthsSinceLastActivity);
            if (monthsSinceLastActivity >= 3 && inactiveUser.getStatus().equalsIgnoreCase("inactive")) {
                List<User> deactivatedUsers = userRepository.findDeactivatedUsersWithoutPhoneNumber();
                if (!deactivatedUsers.isEmpty()) {
                    User targetUser = deactivatedUsers.get(0);
                    targetUser.setPhoneNumber(inactiveUser.getPhoneNumber());
                    targetUser.setStatus("active");
                    inactiveUser.setPhoneNumber(null);
                    inactiveUser.setStatus("deactivated");
                    userRepository.save(inactiveUser);
                    updated = true;
                }
            }
        }

        logger.info("Recharge status check completed, updated: {}", updated);
        return new RechargeStatusResponse(updated);
    }

    private RechargeDTO convertToRechargeDTO(Recharge recharge) {
        RechargeDTO dto = new RechargeDTO();
        dto.setRechargeId(recharge.getRechargeId());
        dto.setUserId(recharge.getUser().getUserId());
        dto.setPlanId(recharge.getPlan().getId());
        dto.setPhoneNumber(recharge.getPhoneNumber());
        dto.setStartDate(recharge.getStartDate());
        dto.setEndDate(recharge.getEndDate());
        dto.setStatus(recharge.getStatus());
        dto.setTransactionId(recharge.getTransactionId());

        long daysToExpire = ChronoUnit.DAYS.between(LocalDate.now(), recharge.getEndDate());
        dto.setDaysToExpire(daysToExpire);

        UserDTO userDTO = convertToUserDTO(recharge.getUser());
        dto.setUser(userDTO);

        PlanDTO planDTO = convertToPlanDTO(recharge.getPlan());
        dto.setPlan(planDTO);

        return dto;
    }

    private UserDTO convertToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setEmail(user.getEmail());
        dto.setActivationDate(user.getActivationDate());
        dto.setStatus(user.getStatus());
        dto.setAddress(user.getAddress());
        dto.setUsername(user.getUsername());
        return dto;
    }

    private TransactionDTO convertToTransactionDTO(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setTransactionId(transaction.getTransactionId());
        dto.setTransactionDate(transaction.getCreatedAt());
        dto.setAmount(transaction.getAmount());
        dto.setPaymentMode(transaction.getPaymentMethod());
        dto.setStatus(transaction.getStatus());
        return dto;
    }

    private PlanDTO convertToPlanDTO(Plan plan) {
        PlanDTO dto = new PlanDTO();
        dto.setId(plan.getId());
        dto.setName(plan.getName());
        dto.setPrice(plan.getPrice());
        dto.setValidity(plan.getValidity());
        dto.setData(plan.getData());
        dto.setSms(plan.getSms());
        dto.setCalls(plan.getCalls());
        dto.setBenefit1(plan.getBenefit1());
        dto.setBenefit2(plan.getBenefit2());
        dto.setStatus("active");
        return dto;
    }
}