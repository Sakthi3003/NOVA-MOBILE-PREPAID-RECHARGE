package com.nova.controller;

import com.nova.entity.*;
import com.nova.service.PdfGeneratorService;
import com.nova.service.RechargeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
            response.put("message", "Recharge successful");
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

    @GetMapping(value = "/invoice/download/{transactionId}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<ByteArrayResource> downloadInvoice(@PathVariable Long transactionId) {
        Optional<Transaction> transactionOptional = rechargeService.findTransactionsByUserId(
                rechargeService.findInvoiceByTransactionId(transactionId).get().getUser().getUserId()
        ).stream().filter(t -> t.getTransactionId().equals(transactionId)).findFirst();

        if (!transactionOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Transaction transaction = transactionOptional.get();
        Optional<Invoice> invoiceOptional = rechargeService.findInvoiceByTransactionId(transactionId);
        if (!invoiceOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Invoice invoice = invoiceOptional.get();
        Optional<Recharge> rechargeOptional = rechargeService.findRechargeByTransactionId(transactionId);
        if (!rechargeOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Recharge recharge = rechargeOptional.get();
        User user = transaction.getUser();
        Plan plan = recharge.getPlan();

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
            ByteArrayOutputStream pdfStream = pdfGeneratorService.generateInvoice(invoiceData);
            ByteArrayResource resource = new ByteArrayResource(pdfStream.toByteArray());

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice_" + transactionId + ".pdf");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(pdfStream.size())
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}