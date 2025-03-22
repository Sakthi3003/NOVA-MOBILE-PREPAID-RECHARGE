package com.nova.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class TransactionDTO {
    private Long transactionId;
    private LocalDateTime transactionDate;
    private Double amount;
    private String paymentMode;
    private String status;

    // Getters and Setters
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
    public LocalDateTime getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDateTime localDateTime) { this.transactionDate = localDateTime; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}