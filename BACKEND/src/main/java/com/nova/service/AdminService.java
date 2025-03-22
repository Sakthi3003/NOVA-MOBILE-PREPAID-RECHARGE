package com.nova.service;

import com.nova.DTO.PlanDTO;
import com.nova.DTO.RechargeDTO;
import com.nova.DTO.TransactionDTO;
import com.nova.DTO.UserDTO;
import com.nova.DTO.RechargeStatusResponse;
import com.nova.entity.Plan;
import com.nova.entity.Recharge;
import com.nova.entity.Transaction;
import com.nova.entity.User;
import com.nova.repository.RechargeRepository;
import com.nova.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    

    public Page<UserDTO> getAllSubscribers(String search, String status, int page, int size) {
        logger.info("Fetching subscribers with search: '{}', status: '{}', page: {}, size: {}", search, status, page, size);
        PageRequest pageable = PageRequest.of(page, size);
        Page<User> usersPage = userRepository.findBySearchAndStatus(search, status, pageable);
        logger.info("Found {} users", usersPage.getTotalElements());
        return usersPage.map(this::convertToUserDTO1);
    }

    @Transactional
    public void activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getStatus().equalsIgnoreCase("inactive") || user.getStatus().equalsIgnoreCase("suspended")) {
            user.setStatus("active");
            userRepository.save(user);
        } else {
            throw new RuntimeException("User cannot be activated from current status");
        }
    }

    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getStatus().equalsIgnoreCase("active")) {
            user.setStatus("inactive");
            userRepository.save(user);
        } else {
            throw new RuntimeException("User cannot be deactivated from current status");
        }
    }

    @Transactional
    public void suspendUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getStatus().equalsIgnoreCase("active")) {
            user.setStatus("suspended");
            userRepository.save(user);
        } else {
            throw new RuntimeException("User cannot be suspended from current status");
        }
    }

    @Transactional
    public RechargeStatusResponse checkRechargeStatus() {
        boolean updated = false;
        List<User> activeUsers = userRepository.findByStatus("active");
        List<User> inactiveUsers = userRepository.findByStatus("inactive");

        // Check for users who haven't recharged in 3 months
        for (User user : activeUsers) {
            Optional<Recharge> latestRechargeOpt = rechargeRepository.findTopByUserOrderByStartDateDesc(user);
            if (latestRechargeOpt.isPresent()) {
                LocalDate lastRecharge = latestRechargeOpt.get().getStartDate();
                long monthsSinceLastRecharge = ChronoUnit.MONTHS.between(lastRecharge, LocalDate.now());
                if (monthsSinceLastRecharge >= 3) {
                    user.setStatus("inactive");
                    userRepository.save(user);
                    updated = true;
                }
            } else {
                // If no recharge history, compare with activation date
                LocalDate activationDate = user.getActivationDate().toLocalDate();
                long monthsSinceActivation = ChronoUnit.MONTHS.between(activationDate, LocalDate.now());
                if (monthsSinceActivation >= 3) {
                    user.setStatus("inactive");
                    userRepository.save(user);
                    updated = true;
                }
            }
        }

        // Reassign phone numbers for inactive users
        for (User inactiveUser : inactiveUsers) {
            Optional<Recharge> latestRechargeOpt = rechargeRepository.findTopByUserOrderByStartDateDesc(inactiveUser);
            LocalDate lastActivityDate;
            if (latestRechargeOpt.isPresent()) {
                lastActivityDate = latestRechargeOpt.get().getStartDate();
            } else {
                lastActivityDate = inactiveUser.getActivationDate().toLocalDate();
            }
            long monthsSinceLastActivity = ChronoUnit.MONTHS.between(lastActivityDate, LocalDate.now());
            if (monthsSinceLastActivity >= 3 && inactiveUser.getStatus().equalsIgnoreCase("inactive")) {
                List<User> deactivatedUsers = userRepository.findDeactivatedUsersWithoutPhoneNumber();
                if (!deactivatedUsers.isEmpty()) {
                    User targetUser = deactivatedUsers.get(0);
                    targetUser.setPhoneNumber(inactiveUser.getPhoneNumber());
                    targetUser.setStatus("active");
                    inactiveUser.setPhoneNumber(null);
                    inactiveUser.setStatus("deactivated");
                    userRepository.save(targetUser);
                    userRepository.save(inactiveUser);
                    updated = true;
                }
            }
        }

        return new RechargeStatusResponse(updated);
    }

    private UserDTO convertToUserDTO1(User user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setEmail(user.getEmail());
        dto.setActivationDate(user.getActivationDate());
        Optional<Recharge> latestRecharge = rechargeRepository.findTopByUserOrderByStartDateDesc(user);
        dto.setLastRechargeDate(latestRecharge.isPresent() ? latestRecharge.get().getStartDate().toString() : null);
        dto.setStatus(user.getStatus());
        dto.setAddress(user.getAddress());
        dto.setUsername(user.getUsername());
        return dto;
    }
  
}

