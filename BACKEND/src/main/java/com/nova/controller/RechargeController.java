package com.nova.controller;

import com.nova.entity.*;
import com.nova.service.EmailService;
import com.nova.service.PdfGeneratorService;
import com.nova.service.RechargeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/recharge")
public class RechargeController {

    @Autowired
    private RechargeService rechargeService;

    @Autowired
    private PdfGeneratorService pdfGeneratorService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/recharge")
    public ResponseEntity<Map<String, Object>> recharge(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            Long planId = Long.parseLong(request.get("planId").toString());
            String phoneNumber = request.get("phoneNumber").toString();
            String paymentMethod = request.get("paymentMethod").toString();

            Recharge recharge = rechargeService.rechargeUser(userId, planId, phoneNumber, paymentMethod);

            response.put("status", "Success");
            response.put("transactionId", recharge.getTransactionId());
            response.put("rechargeStatus", recharge.getStatus()); // Include recharge status
            response.put("message", "Recharge " + (recharge.getStatus().equals("Active") ? "successful" : "queued"));
            response.put("startDate", recharge.getStartDate().toString());
            response.put("endDate", recharge.getEndDate().toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "Error");
            response.put("message", "Failed to process recharge: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/active-plan/{userId}")
    public ResponseEntity<Recharge> getActivePlan(@PathVariable Long userId) {
        Optional<Recharge> rechargeOptional = rechargeService.findActiveRechargeByUserId(userId);
        return rechargeOptional.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/previous-plans/{userId}")
    public ResponseEntity<List<Recharge>> getPreviousPlans(@PathVariable Long userId) {
        List<Recharge> recharges = rechargeService.findPreviousRechargesByUserId(userId);
        return ResponseEntity.ok(recharges);
    }

    @GetMapping("/transactions/{userId}")
    public ResponseEntity<List<Transaction>> getTransactions(@PathVariable Long userId) {
        List<Transaction> transactions = rechargeService.findTransactionsByUserId(userId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/recharges/{userId}")
    public ResponseEntity<List<Recharge>> getRecharges(@PathVariable Long userId) {
        List<Recharge> recharges = rechargeService.findRechargesByUserId(userId);
        return ResponseEntity.ok(recharges);
    }

    @GetMapping("/invoices/{userId}")
    public ResponseEntity<List<Invoice>> getInvoices(@PathVariable Long userId) {
        List<Invoice> invoices = rechargeService.findInvoicesByUserId(userId);
        return ResponseEntity.ok(invoices);
    }

    @PostMapping("/invoice/email")
    public ResponseEntity<Map<String, Object>> sendInvoiceEmail(@RequestBody Map<String, Object> request) {
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
            String sms = request.get("sms") != null ? request.get("sms").toString() : "N/A"; // Optional field

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
            invoiceData.put("sms", sms); // Include even if optional

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
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Failed to send invoice email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
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
}