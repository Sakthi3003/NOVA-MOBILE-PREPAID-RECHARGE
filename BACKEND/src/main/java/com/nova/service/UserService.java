package com.nova.service;

import com.nova.DTO.UpdateUserRequest;
import com.nova.DTO.UserDTO;
import com.nova.DTO.UserDetailsResponse;
import com.nova.entity.Recharge;
import com.nova.entity.User;
import com.nova.repository.RechargeRepository;
import com.nova.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final RechargeRepository rechargeRepository;

    @Autowired
    public UserService(UserRepository userRepository, RechargeRepository rechargeRepository) {
        this.userRepository = userRepository;
        this.rechargeRepository = rechargeRepository;
    }

    public User checkPhoneNumber(String number) {
        logger.debug("Checking user with phone number: {}", number);
        return userRepository.findByPhoneNumber(number)
                .orElseThrow(() -> {
                    logger.warn("User not found with phone number: {}", number);
                    return new RuntimeException("User not found with phone number: " + number);
                });
    }

    @Transactional
    public UserDetailsResponse updateUserDetails(UpdateUserRequest updateRequest) {
        try {
            logger.info("Attempting to update user with request: {}", updateRequest);
            User updatedUser = updateUser(updateRequest);
            UserDetailsResponse response = getUserDetails(updatedUser);
            logger.info("User updated successfully: {}", response);
            return response;
        } catch (Exception e) {
            logger.error("Error updating user details: {}", e.getMessage(), e);
            throw e;
        }
    }

    public User updateUser(UpdateUserRequest updateRequest) {
        String subject = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.debug("Updating user for subject: {}", subject);

        if (subject == null) {
            logger.error("No authenticated user found in SecurityContext");
            throw new RuntimeException("No authenticated user found");
        }

        User user = getAuthenticatedUser(subject);
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().equals(user.getEmail())) {
            validateEmailUniqueness(updateRequest.getEmail());
            user.setEmail(updateRequest.getEmail());
        }
        return userRepository.save(user);
    }

    private User getAuthenticatedUser(String subject) {
        if (isPhoneNumber(subject)) {
            return userRepository.findByPhoneNumber("+91" + subject)
                    .orElseThrow(() -> {
                        logger.warn("User not found with phone number: {}", subject);
                        return new RuntimeException("User not found with phone number: " + subject);
                    });
        }
        return userRepository.findByUsername(subject)
                .orElseThrow(() -> {
                    logger.warn("User not found with username: {}", subject);
                    return new RuntimeException("User not found with username: " + subject);
                });
    }

    private void validateEmailUniqueness(String email) {
        userRepository.findByEmail(email).ifPresent(u -> {
            logger.warn("Attempt to use already existing email: {}", email);
            throw new RuntimeException("Email is already in use");
        });
    }

    public Map<String, Object> getUserPlans() {
        try {
            logger.info("Fetching plans for authenticated user");
            String username = getAuthenticatedUsername();
            User user = getUserByUsername(username);
            List<Recharge> recharges = rechargeRepository.findByUser(user);
            logger.debug("Found {} recharges for user: {}", recharges.size(), username);
            return processUserPlans(recharges);
        } catch (Exception e) {
            logger.error("Error fetching user plans: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String getAuthenticatedUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            logger.debug("Authenticated username from UserDetails: {}", username);
            return username;
        }
        String username = principal.toString();
        logger.debug("Authenticated username from principal: {}", username);
        return username;
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    logger.warn("User not found with username: {}", username);
                    return new RuntimeException("User not found with username: " + username);
                });
    }

    private Map<String, Object> processUserPlans(List<Recharge> recharges) {
        LocalDate today = LocalDate.now();
        logger.debug("Processing plans with current date: {}", today);
        
        updateExpiredPlans(recharges, today);
        Map<String, Object> response = new HashMap<>();
        response.put("activePlans", getActivePlans(recharges, today));
        response.put("pendingPlans", getPlansByStatus(recharges, "Pending"));
        response.put("expiredPlans", getPlansByStatus(recharges, "Expired"));
        
        logger.info("Plans processed - Active: {}, Pending: {}, Expired: {}", 
            ((List<?>) response.get("activePlans")).size(),
            ((List<?>) response.get("pendingPlans")).size(),
            ((List<?>) response.get("expiredPlans")).size());
        return response;
    }

    private void updateExpiredPlans(List<Recharge> recharges, LocalDate today) {
        recharges.forEach(recharge -> {
            if ("Active".equalsIgnoreCase(recharge.getStatus()) && today.isAfter(recharge.getEndDate())) {
                recharge.setStatus("Expired");
                rechargeRepository.save(recharge);
                logger.info("Updated recharge {} to Expired (endDate: {})", 
                    recharge.getRechargeId(), recharge.getEndDate());
            }
        });
    }

    private List<Map<String, Object>> getActivePlans(List<Recharge> recharges, LocalDate today) {
        return recharges.stream()
                .filter(r -> "Active".equalsIgnoreCase(r.getStatus()) && 
                    (today.isEqual(r.getStartDate()) || today.isAfter(r.getStartDate())) &&
                    (today.isEqual(r.getEndDate()) || today.isBefore(r.getEndDate())))
                .map(this::mapRechargeToPlanData)
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getPlansByStatus(List<Recharge> recharges, String status) {
        return recharges.stream()
                .filter(r -> status.equalsIgnoreCase(r.getStatus()))
                .map(this::mapRechargeToPlanData)
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapRechargeToPlanData(Recharge recharge) {
        Map<String, Object> planData = new HashMap<>();
        try {
            planData.put("id", recharge.getRechargeId());
            planData.put("name", recharge.getPlan().getName());
            planData.put("category", recharge.getPlan().getCategory().getName());
            planData.put("price", recharge.getPlan().getPrice());
            planData.put("startDate", recharge.getStartDate().toString());
            planData.put("endDate", recharge.getEndDate().toString());
            planData.put("sms", recharge.getPlan().getSms());
            planData.put("calls", recharge.getPlan().getCalls());
            planData.put("data", recharge.getPlan().getData());
            planData.put("benefits", List.of(
                    recharge.getPlan().getBenefit1() != null ? recharge.getPlan().getBenefit1() : "",
                    recharge.getPlan().getBenefit2() != null ? recharge.getPlan().getBenefit2() : ""
            ).stream().filter(b -> !b.isEmpty()).collect(Collectors.toList()));
            planData.put("status", recharge.getStatus());
        } catch (Exception e) {
            logger.error("Error mapping recharge ID: {} to plan data: {}", recharge.getRechargeId(), e.getMessage(), e);
        }
        return planData;
    }

    public UserDetailsResponse getUserDetails(User user) {
        UserDetailsResponse userDetails = new UserDetailsResponse();
        try {
            userDetails.setFirstName(user.getFirstName());
            userDetails.setLastName(user.getLastName());
            userDetails.setEmail(user.getEmail());
            userDetails.setPhoneNumber(user.getPhoneNumber());
            userDetails.setAddress(user.getAddress());
            userDetails.setActivationDate(user.getActivationDate());
            userDetails.setStatus(user.getStatus());
            logger.debug("Created user details response for user: {}", user.getUsername());
        } catch (Exception e) {
            logger.error("Error creating user details response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create user details response");
        }
        return userDetails;
    }

    private boolean isPhoneNumber(String subject) {
        boolean result = subject.matches("\\+?\\d+");
        logger.debug("Checking if {} is phone number: {}", subject, result);
        return result;
    }

    public Optional<User> findById(Long userId) {
        logger.debug("Finding user by ID: {}", userId);
        return userRepository.findById(userId);
    }

    public User saveUser(User user) {
        try {
            logger.info("Saving user: {}", user.getUsername());
            User savedUser = userRepository.save(user);
            logger.info("User saved successfully: {}", savedUser.getUsername());
            return savedUser;
        } catch (Exception e) {
            logger.error("Error saving user: {}", e.getMessage(), e);
            throw e;
        }
    }

    public User findByUsername(String username) {
        logger.debug("Finding user by username: {}", username);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    logger.warn("User not found with username: {}", username);
                    return new RuntimeException("User not found");
                });
    }

    @Transactional
    public void activateUser(Long userId) {
        logger.info("Attempting to activate user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("User not found with ID: {}", userId);
                    return new RuntimeException("User not found");
                });
        if (!"inactive".equalsIgnoreCase(user.getStatus()) && !"suspended".equalsIgnoreCase(user.getStatus())) {
            logger.warn("Cannot activate user with status: {}", user.getStatus());
            throw new RuntimeException("User cannot be activated from current status");
        }
        user.setStatus("active");
        userRepository.save(user);
        logger.info("User {} activated successfully", userId);
    }

    @Transactional
    public void deactivateUser(Long userId) {
        logger.info("Attempting to deactivate user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("User not found with ID: {}", userId);
                    return new RuntimeException("User not found");
                });
        if (!"active".equalsIgnoreCase(user.getStatus())) {
            logger.warn("Cannot deactivate user with status: {}", user.getStatus());
            throw new RuntimeException("User cannot be deactivated from current status");
        }
        user.setStatus("inactive");
        userRepository.save(user);
        logger.info("User {} deactivated successfully", userId);
    }

    @Transactional
    public void suspendUser(Long userId) {
        logger.info("Attempting to suspend user with ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("User not found with ID: {}", userId);
                    return new RuntimeException("User not found");
                });
        if (!"active".equalsIgnoreCase(user.getStatus())) {
            logger.warn("Cannot suspend user with status: {}", user.getStatus());
            throw new RuntimeException("User cannot be suspended from current status");
        }
        user.setStatus("suspended");
        userRepository.save(user);
        logger.info("User {} suspended successfully", userId);
    }

    public Page<UserDTO> getAllSubscribers(String search, String status, int page, int size, String sort) {
        logger.info("Fetching subscribers with search: '{}', status: '{}', page: {}, size: {}, sort: {}", 
            search, status, page, size, sort);
        
        validatePaginationParams(page, size);
        Sort sortOrder = parseSortParameter(sort);

        try {
            PageRequest pageable = PageRequest.of(page, size, sortOrder);
            Page<User> usersPage = userRepository.findBySearchAndStatus(search, status, pageable);
            logger.info("Found {} users matching criteria", usersPage.getTotalElements());
            return usersPage.map(this::convertToUserDTO);
        } catch (Exception e) {
            logger.error("Error fetching subscribers: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void validatePaginationParams(int page, int size) {
        if (page < 0) {
            logger.warn("Invalid page number: {}", page);
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        if (size <= 0) {
            logger.warn("Invalid page size: {}", size);
            throw new IllegalArgumentException("Page size must be greater than 0");
        }
    }

    private Sort parseSortParameter(String sort) {
        String[] sortParams = sort.split(",");
        if (sortParams.length != 2) {
            logger.warn("Invalid sort parameter format: {}", sort);
            throw new IllegalArgumentException("Sort parameter must be in the format 'field,direction'");
        }

        String sortField = sortParams[0];
        String sortDirection = sortParams[1];

        List<String> validFields = List.of("userId", "firstName", "lastName", "email", "phoneNumber", 
            "activationDate", "status", "username");
        if (!validFields.contains(sortField)) {
            logger.warn("Invalid sort field: {}", sortField);
            throw new IllegalArgumentException("Invalid sort field: " + sortField + ". Valid fields are: " + validFields);
        }

        if (!"asc".equalsIgnoreCase(sortDirection) && !"desc".equalsIgnoreCase(sortDirection)) {
            logger.warn("Invalid sort direction: {}", sortDirection);
            throw new IllegalArgumentException("Invalid sort direction: " + sortDirection + ". Must be 'asc' or 'desc'");
        }

        return Sort.by(sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortField);
    }

    private UserDTO convertToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        try {
            dto.setUserId(user.getUserId());
            dto.setFirstName(user.getFirstName());
            dto.setLastName(user.getLastName());
            dto.setPhoneNumber(user.getPhoneNumber());
            dto.setEmail(user.getEmail());
            dto.setActivationDate(user.getActivationDate());
            Optional<Recharge> latestRecharge = rechargeRepository.findTopByUserOrderByStartDateDescRechargeIdDesc(user);
            dto.setLastRechargeDate(latestRecharge.map(r -> r.getStartDate().toString()).orElse(null));
            dto.setStatus(user.getStatus());
            dto.setAddress(user.getAddress());
            dto.setUsername(user.getUsername());
            logger.debug("Converted user to DTO: {}", user.getUsername());
        } catch (Exception e) {
            logger.error("Error converting user to DTO: {}", e.getMessage(), e);
        }
        return dto;
    }

    public Optional<User> getUserByUsername1(String username) {
        logger.debug("Getting user by username: {}", username);
        return userRepository.findByUsername(username);
    }
}