package com.nova.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nova.DTO.UpdateUserRequest;
import com.nova.DTO.UserDetailsResponse;
import com.nova.entity.Recharge;
import com.nova.entity.User;
import com.nova.repository.RechargeRepository;
import com.nova.repository.UserRepository;
import com.nova.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/user")
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository repo;

    @Autowired
    private RechargeRepository repo1;

    private final UserService userService;

    public UserController(UserService userService, RechargeRepository repo1) {
        this.userService = userService;
        this.repo1 = repo1;
    }

    @GetMapping("/check-number")
    public ResponseEntity<?> checkBNumber(@RequestParam String number) {
        logger.info("Checking user with phone number: {}", number);
        User user = repo.findByPhoneNumber(number)
                .orElseThrow(() -> {
                    logger.warn("User not found with phone number: {}", number);
                    return new RuntimeException("User not found with phone number: " + number);
                });
        logger.info("User found with phone number: {}", number);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/update")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> updateUser(@Valid @RequestBody UpdateUserRequest updateRequest) {
        logger.info("Attempting to update user with request: {}", updateRequest);
        User updatedUser = userService.updateUser(updateRequest);
        UserDetailsResponse userDetails = userService.getUserDetails(updatedUser);
        logger.info("User updated successfully: {}", userDetails);
        return ResponseEntity.ok(userDetails);
    }

    @GetMapping("/plans")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getUserPlans() {
        logger.info("Fetching plans for authenticated user");
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        final String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        logger.debug("Authenticated username: {}", username);

        User user = repo.findByUsername(username)
                .orElseThrow(() -> {
                    logger.warn("User not found with username: {}", username);
                    return new RuntimeException("User not found with username: " + username);
                });

        List<Recharge> recharges = repo1.findByUser(user);
        logger.debug("Found {} recharges for user: {}", recharges.size(), username);

        Map<String, Object> response = new HashMap<>();
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> activePlans = recharges.stream()
                .filter(recharge -> recharge.getStatus().equalsIgnoreCase("active") &&
                        (today.isEqual(recharge.getStartDate()) || today.isAfter(recharge.getStartDate())) &&
                        (today.isEqual(recharge.getEndDate()) || today.isBefore(recharge.getEndDate())))
                .map(recharge -> {
                    Map<String, Object> planData = new HashMap<>();
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
                    return planData;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> previousPlans = recharges.stream()
                .filter(recharge -> !recharge.getStatus().equalsIgnoreCase("active") ||
                        today.isAfter(recharge.getEndDate()))
                .map(recharge -> {
                    Map<String, Object> planData = new HashMap<>();
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
                    return planData;
                })
                .collect(Collectors.toList());

        response.put("activePlans", activePlans);
        response.put("previousPlans", previousPlans);
        logger.info("Plans fetched successfully for user: {}", username);
        return ResponseEntity.ok(response);
    }

    private String formatPhoneNumber(String phoneNumber) {
        logger.debug("Formatting phone number: {}", phoneNumber);
        if (!phoneNumber.startsWith("+")) {
            return "" + phoneNumber;
        }
        return phoneNumber;
    }
}