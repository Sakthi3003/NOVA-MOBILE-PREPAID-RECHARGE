package com.nova.controller;

import com.nova.DTO.AuthRequest;
import com.nova.DTO.OtpRequest;
import com.nova.DTO.OtpVerify;

import com.nova.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@CrossOrigin("*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody AuthRequest authRequest) {
        logger.info("Login attempt for username: {}", authRequest.getUsername());
        Map<String, Object> response = authService.login(authRequest);
        logger.info("Login successful for username: {}", authRequest.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/otp/request")
    public ResponseEntity<Map<String, Object>> requestOtp(@Valid @RequestBody OtpRequest otp) {
        logger.info("OTP request for phone number: {}", otp.getPhoneNumber());
        Map<String, Object> response = authService.requestOtp(otp);
        logger.info("OTP sent successfully to: {}", formatPhoneNumber(otp.getPhoneNumber()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(@Valid @RequestBody OtpVerify verifyRequest) {
        logger.info("Verifying OTP for phone number: {}", verifyRequest.getPhoneNumber());
        Map<String, Object> response = authService.verifyOtp(verifyRequest);
        logger.info("OTP verified successfully for phone: {}", verifyRequest.getPhoneNumber());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        logger.info("Logout request with token: {}", token);
        Map<String, Object> response = authService.logout(token);
        logger.info("Logout successful");
        return ResponseEntity.ok(response);
    }

    private String formatPhoneNumber(String phoneNumber) {
        logger.debug("Formatting phone number: {}", phoneNumber);
        if (phoneNumber == null) {
            logger.warn("Phone number is null, returning empty string");
            return "";
        }
        if (!phoneNumber.startsWith("+")) {
            return "+91" + phoneNumber;
        }
        return phoneNumber;
    }
}