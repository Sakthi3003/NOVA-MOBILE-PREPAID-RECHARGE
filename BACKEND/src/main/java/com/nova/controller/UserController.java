package com.nova.controller;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.nova.DTO.UpdateUserRequest;
import com.nova.DTO.UserDetailsResponse;
import com.nova.service.UserService;
import jakarta.validation.Valid;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/user")
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/check-number")
    public ResponseEntity<?> checkBNumber(@RequestParam String number) {
        logger.info("Received request to check phone number: {}", number);
        return ResponseEntity.ok(userService.checkPhoneNumber(number));
    }

    @PutMapping("/update")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> updateUser(@Valid @RequestBody UpdateUserRequest updateRequest) {
        logger.info("Received request to update user with data: {}", updateRequest);
        UserDetailsResponse userDetails = userService.updateUserDetails(updateRequest);
        logger.info("User updated successfully for request: {}", updateRequest);
        return ResponseEntity.ok(userDetails);
    }

    @GetMapping("/plans")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getUserPlans() {
        logger.info("Received request to fetch user plans");
        Map<String, Object> plansResponse = userService.getUserPlans();
        logger.info("Successfully retrieved user plans");
        return ResponseEntity.ok(plansResponse);
    }
}