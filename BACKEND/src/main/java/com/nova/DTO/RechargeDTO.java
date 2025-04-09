package com.nova.DTO;

import java.time.LocalDate;

public class RechargeDTO {
    private Long rechargeId;
    private Long userId;
    private Long planId;
    private String phoneNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Long transactionId;
    private Long daysToExpire;
    private UserDTO user;
    private PlanDTO plan;

    // Getters and Setters
    public Long getRechargeId() { return rechargeId; }
    public void setRechargeId(Long rechargeId) { this.rechargeId = rechargeId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
    public Long getDaysToExpire() { return daysToExpire; }
    public void setDaysToExpire(Long daysToExpire) { this.daysToExpire = daysToExpire; }
    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }
    public PlanDTO getPlan() { return plan; }
    public void setPlan(PlanDTO plan) { this.plan = plan; }
}