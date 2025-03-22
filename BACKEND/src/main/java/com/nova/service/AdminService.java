package com.nova.service;

import com.nova.DTO.PlanDTO;
import com.nova.DTO.RechargeDTO;
import com.nova.DTO.TransactionDTO;
import com.nova.DTO.UserDTO;
import com.nova.entity.Plan;
import com.nova.entity.Recharge;
import com.nova.entity.Transaction;
import com.nova.entity.User;
import com.nova.repository.RechargeRepository;
import com.nova.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {
    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private RechargeRepository rechargeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    public List<RechargeDTO> getExpiringPlans() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);
        logger.info("Fetching recharges expiring between {} and {}", today, threeDaysFromNow);
        List<Recharge> recharges = rechargeRepository.findByEndDateBetween(today, threeDaysFromNow);
        return recharges.stream().map(this::convertToRechargeDTO).collect(Collectors.toList());
    }

    public Map<String, Object> getUserDetailsAndTransactions(Long userId) {
        logger.info("Fetching user details and transactions for userId: {}", userId);
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

    public void sendNotification(String phoneNumber, String message) {
        logger.info("Sending notification to phone number: {}", phoneNumber);
        try {
            otpService.sendSms(phoneNumber, message);
            logger.info("Notification sent successfully to {}", phoneNumber);
        } catch (Exception e) {
            logger.error("Failed to send notification to {}: {}", phoneNumber, e.getMessage());
            throw e;
        }
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

        // Calculate days to expire
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