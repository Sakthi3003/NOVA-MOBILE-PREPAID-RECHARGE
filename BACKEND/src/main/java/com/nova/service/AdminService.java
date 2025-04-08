package com.nova.service;

import com.nova.DTO.RechargeDTO;
import com.nova.DTO.RechargeStatusResponse;
import com.nova.DTO.UpdateAdminRequest;
import com.nova.DTO.UserDTO;
import com.nova.entity.User;
import com.nova.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {
    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private UserService userService;

    @Autowired
    private RechargeService rechargeService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> updateAdminProfile(String token, UpdateAdminRequest updateRequest) {
        String username = jwtUtil.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtUtil.validateToken(token, userDetails)) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        User user = userService.getUserByUsername(username);

        boolean isAdmin = user.getRoles().stream().anyMatch(role -> role.getRoleName().equals("ADMIN"));
        if (!isAdmin) {
            throw new IllegalArgumentException("Only admins can update their profile here");
        }

        if (updateRequest.getEmail() != null && !updateRequest.getEmail().isEmpty()) {
            if (!updateRequest.getEmail().matches("\\S+@\\S+\\.\\S+")) {
                throw new IllegalArgumentException("Invalid email format");
            }
            user.setEmail(updateRequest.getEmail());
        }

        if (updateRequest.getPassword() != null && !updateRequest.getPassword().isEmpty()) {
            if (updateRequest.getPassword().length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters");
            }
            user.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
        }

        User updatedUser = userService.saveUser(user);

        Map<String, Object> response = new HashMap<>();
        response.put("role", "ADMIN");
        response.put("user_id", updatedUser.getUserId());
        response.put("accessToken", token);
        response.put("refreshToken", jwtUtil.generateRefreshToken(username, List.of("ADMIN")));
        response.put("userDetails", new HashMap<String, Object>() {{
            put("activation_date", updatedUser.getActivationDate().toString());
            put("address", updatedUser.getAddress());
            put("email", updatedUser.getEmail());
            put("first_name", updatedUser.getFirstName());
            put("last_name", updatedUser.getLastName());
            put("phone_number", updatedUser.getPhoneNumber());
            put("status", updatedUser.getStatus());
            put("username", updatedUser.getUsername());
        }});

        return response;
    }

    public List<RechargeDTO> getExpiringPlans() {
        return rechargeService.getExpiringPlans();
    }

    public Map<String, Object> getUserDetailsAndTransactions(Long userId) {
        return rechargeService.getUserRechargesAndTransactions(userId);
    }

    public void sendNotification(String phoneNumber, String message) {
        notificationService.sendNotification(phoneNumber, message);
    }

    public Page<UserDTO> getAllSubscribers(String search, String status, int page, int size, String sort) {
        return userService.getAllSubscribers(search, status, page, size, sort);
    }

    public void activateUser(Long userId) {
        userService.activateUser(userId);
    }

    public void deactivateUser(Long userId) {
        userService.deactivateUser(userId);
    }

    public void suspendUser(Long userId) {
        userService.suspendUser(userId);
    }

    public RechargeStatusResponse checkRechargeStatus() {
        return rechargeService.checkRechargeStatus();
    }
}