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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    
    public Page<UserDTO> getAllSubscribers(String search, String status, int page, int size, String sort) {
        logger.info("Fetching subscribers with search: '{}', status: '{}', page: {}, size: {}, sort: {}", search, status, page, size, sort);
        try {
            if (page < 0) {
                throw new IllegalArgumentException("Page number cannot be negative");
            }
            if (size <= 0) {
                throw new IllegalArgumentException("Page size must be greater than 0");
            }

            String[] sortParams = sort.split(",");
            if (sortParams.length != 2) {
                throw new IllegalArgumentException("Sort parameter must be in the format 'field,direction' (e.g., 'userId,asc')");
            }

            String sortField = sortParams[0];
            String sortDirection = sortParams[1];

            // Validate sort field
            List<String> validFields = List.of("userId", "firstName", "lastName", "email", "phoneNumber", "activationDate", "status", "username");
            if (!validFields.contains(sortField)) {
                throw new IllegalArgumentException("Invalid sort field: " + sortField + ". Valid fields are: " + validFields);
            }

            // Validate sort direction
            if (!sortDirection.equalsIgnoreCase("asc") && !sortDirection.equalsIgnoreCase("desc")) {
                throw new IllegalArgumentException("Invalid sort direction: " + sortDirection + ". Must be 'asc' or 'desc'");
            }

            Sort sortOrder = Sort.by(sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortField);
            PageRequest pageable = PageRequest.of(page, size, sortOrder);
            Page<User> usersPage = userRepository.findBySearchAndStatus(search, status, pageable);
            logger.info("Found {} users", usersPage.getTotalElements());
            return usersPage.map(this::convertToUserDTO1);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid request parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error fetching subscribers: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch subscribers: " + e.getMessage(), e);
        }
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

    private UserDTO convertToUserDTO1(User user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setEmail(user.getEmail());
        dto.setActivationDate(user.getActivationDate());
        Optional<Recharge> latestRecharge = rechargeRepository.findTopByUserOrderByStartDateDescRechargeIdDesc(user);
        dto.setLastRechargeDate(latestRecharge.isPresent() ? latestRecharge.get().getStartDate().toString() : null);
        dto.setStatus(user.getStatus());
        dto.setAddress(user.getAddress());
        dto.setUsername(user.getUsername());
        return dto;
    }
}