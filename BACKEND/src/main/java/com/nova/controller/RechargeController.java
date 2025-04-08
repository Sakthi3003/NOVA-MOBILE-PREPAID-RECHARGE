package com.nova.controller;

import com.nova.entity.*;
import com.nova.service.RechargeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/recharge")
public class RechargeController {

    @Autowired
    private RechargeService rechargeService;

    @PostMapping("/recharge")
    public ResponseEntity<Map<String, Object>> recharge(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(rechargeService.processRecharge(request));
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
        return ResponseEntity.ok(rechargeService.sendInvoiceEmail(request));
    }
}