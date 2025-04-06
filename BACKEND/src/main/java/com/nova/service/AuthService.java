package com.nova.service;

import com.nova.DTO.AuthRequest;
import com.nova.DTO.AuthResponse;
import com.nova.DTO.OtpRequest;
import com.nova.DTO.OtpVerify;
import com.nova.entity.Role;
import com.nova.entity.User;
import com.nova.exception.InvalidCredentialsException;
import com.nova.exception.InvalidOtpException;
import com.nova.exception.InvalidRoleException;
import com.nova.exception.UserNotFoundException;
import com.nova.repository.UserRepository;
import com.nova.security.JwtUtil;
import com.nova.service.TwillioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;
    private final TwillioService otpService;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                       UserRepository userRepository, UserDetailsService userDetailsService,
                       TwillioService otpService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.otpService = otpService;
    }

    public Map<String, Object> login(AuthRequest authRequest) {
        Map<String, Object> response = new HashMap<>();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
        } catch (BadCredentialsException e) {
            logger.warn("Invalid credentials for username: {}", authRequest.getUsername());
            throw new InvalidCredentialsException("Invalid username or password");
        } catch (Exception e) {
            logger.error("Authentication failed for username: {}: {}", authRequest.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Authentication failed: " + e.getMessage(), e);
        }

        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.getUsername());
            User user = userRepository.findByUsername(authRequest.getUsername())
                    .orElseThrow(() -> {
                        logger.warn("Admin not found with username: {}", authRequest.getUsername());
                        return new UserNotFoundException("Admin not found with username: " + authRequest.getUsername());
                    });

            List<String> roles = user.getRoles().stream()
                    .map(Role::getRoleName)
                    .filter(role -> role.equals("ADMIN") || role.equals("USER"))
                    .collect(Collectors.toList());

            if (roles.isEmpty()) {
                logger.warn("No valid roles for user: {}", authRequest.getUsername());
                throw new InvalidRoleException("No valid roles (ADMIN or USER) assigned to user: " + authRequest.getUsername());
            }

            String accessToken = jwtUtil.generateToken(userDetails.getUsername(), roles);
            String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), roles);
            String responseRole = "ADMIN";

            response.put("status", "Success");
            response.put("accessToken", accessToken);
            response.put("refreshToken", refreshToken);
            response.put("role", responseRole);
            response.put("user_id", user.getUserId());
            response.put("userDetails", new HashMap<String, Object>() {{
                put("activation_date", user.getActivationDate().toString());
                put("address", user.getAddress());
                put("email", user.getEmail());
                put("first_name", user.getFirstName());
                put("last_name", user.getLastName());
                put("phone_number", formatPhoneNumber(user.getPhoneNumber()));
                put("status", user.getStatus());
                put("username", user.getUsername());
            }});

            return response;

        } catch (UserNotFoundException | InvalidRoleException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to process login for username: {}: {}", authRequest.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Failed to process login: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> requestOtp(OtpRequest otp) {
        Map<String, Object> response = new HashMap<>();

        try {
            String formattedPhoneNumber = formatPhoneNumber(otp.getPhoneNumber());
            User user = userRepository.findByPhoneNumber(otp.getPhoneNumber())
                    .orElseThrow(() -> {
                        logger.warn("Phone number not registered: {}", otp.getPhoneNumber());
                        return new UserNotFoundException("Phone number not registered: " + otp.getPhoneNumber());
                    });

            otpService.generateOtp(otp.getPhoneNumber());

            response.put("status", "Success");
            response.put("message", "OTP sent to " + formattedPhoneNumber);
            return response;

        } catch (UserNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to process OTP request for phone number: {}: {}", otp.getPhoneNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to process OTP request: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> verifyOtp(OtpVerify verifyRequest) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (!otpService.verifyOtp(verifyRequest.getPhoneNumber(), verifyRequest.getOtp())) {
                logger.warn("Invalid OTP for phone: {}", verifyRequest.getPhoneNumber());
                throw new InvalidOtpException("Invalid OTP for phone number: " + verifyRequest.getPhoneNumber());
            }

            User user = userRepository.findByPhoneNumber(verifyRequest.getPhoneNumber())
                    .orElseThrow(() -> {
                        logger.warn("User not found with phone number: {}", verifyRequest.getPhoneNumber());
                        return new UserNotFoundException("User not found with phone number: " + verifyRequest.getPhoneNumber());
                    });

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            List<String> roles = user.getRoles().stream()
                    .map(Role::getRoleName)
                    .filter(role -> role.equals("ADMIN") || role.equals("USER"))
                    .collect(Collectors.toList());

            if (roles.isEmpty()) {
                logger.warn("No valid roles for user with phone: {}", verifyRequest.getPhoneNumber());
                throw new InvalidRoleException("No valid roles (ADMIN or USER) assigned to user with phone: " + verifyRequest.getPhoneNumber());
            }

            String accessToken = jwtUtil.generateToken(userDetails.getUsername(), roles);
            String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), roles);
            String responseRole = "USER";

            response.put("status", "Success");
            response.put("accessToken", accessToken);
            response.put("refreshToken", refreshToken);
            response.put("role", responseRole);
            response.put("user_id", user.getUserId());
            response.put("userDetails", new HashMap<String, Object>() {{
                put("activation_date", user.getActivationDate().toString());
                put("address", user.getAddress());
                put("email", user.getEmail());
                put("first_name", user.getFirstName());
                put("last_name", user.getLastName());
                put("phone_number", formatPhoneNumber(user.getPhoneNumber()));
                put("status", user.getStatus());
                put("username", user.getUsername());
            }});

            return response;

        } catch (InvalidOtpException | UserNotFoundException | InvalidRoleException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to verify OTP for phone number: {}: {}", verifyRequest.getPhoneNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to verify OTP: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> logout(String token) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (token == null || !token.startsWith("Bearer ")) {
                logger.warn("Invalid or missing Authorization header");
                throw new IllegalArgumentException("Invalid or missing Authorization header");
            }

            String jwtToken = token.substring(7);
            jwtUtil.invalidateToken(jwtToken);

            response.put("status", "Success");
            response.put("message", "Logged out successfully");
            return response;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Failed to process logout: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process logout: " + e.getMessage(), e);
        }
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