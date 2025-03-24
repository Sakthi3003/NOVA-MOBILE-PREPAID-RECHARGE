package com.nova.controller;

import com.nova.DTO.RechargeDTO;
import com.nova.DTO.RechargeStatusResponse;
import com.nova.DTO.ResponseDTO;
import com.nova.DTO.UpdateAdminRequest;
import com.nova.DTO.UserDTO;
import com.nova.entity.User;
import com.nova.repository.UserRepository;
import com.nova.security.JwtUtil;
import com.nova.service.AdminService;
import com.nova.service.CustomUserDetailsService;
import com.nova.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @PutMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAdminProfile(HttpServletRequest request, @RequestBody UpdateAdminRequest updateRequest) {
        try {
            // Extract token from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "No valid token provided"));
            }
            String token = authHeader.substring(7);

            // Extract username from JWT
            String username = jwtUtil.extractUsername(token);

            // Load UserDetails for validation
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!jwtUtil.validateToken(token, userDetails)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or expired token"));
            }

            // Fetch user from database
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if the user is an admin
            boolean isAdmin = user.getRoles().stream().anyMatch(role -> role.getRoleName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only admins can update their profile here"));
            }

            // Update email if provided
            if (updateRequest.getEmail() != null && !updateRequest.getEmail().isEmpty()) {
                if (!updateRequest.getEmail().matches("\\S+@\\S+\\.\\S+")) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid email format"));
                }
                user.setEmail(updateRequest.getEmail());
            }

            // Update password if provided
            if (updateRequest.getPassword() != null && !updateRequest.getPassword().isEmpty()) {
                if (updateRequest.getPassword().length() < 8) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Password must be at least 8 characters"));
                }
                user.setPassword(passwordEncoder.encode(updateRequest.getPassword()));
            }

            // Save updated user
            User updatedUser = userService.saveUser(user);

            // Prepare response matching session storage
            Map<String, Object> response = new HashMap<>();
            response.put("role", "ADMIN");
            response.put("user_id", updatedUser.getUserId());
            response.put("accessToken", token); // Reuse existing token
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

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred while updating the admin profile"));
        }
    }
    
    // Fetch plans expiring within 3 days
    @GetMapping("/expiring-plans")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getExpiringPlans(@RequestHeader("Authorization") String token) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Invalid token");
            }

            List<RechargeDTO> expiringPlans = adminService.getExpiringPlans();
            response.put("status", "SUCCESS");
            response.put("data", expiringPlans);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Fetch user details and transaction history
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserDetailsAndTransactions(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String token) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Invalid token");
            }

            Map<String, Object> userData = adminService.getUserDetailsAndTransactions(userId);
            response.put("status", "SUCCESS");
            response.put("data", userData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Send notification
    @PostMapping("/notify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendNotification(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String token) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Invalid token");
            }

            String phoneNumber = request.get("phoneNumber");
            String message = request.get("message");
            adminService.sendNotification(phoneNumber, message);

            response.put("status", "SUCCESS");
            response.put("message", "Notification sent successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("message", "Failed to send notification: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/subscribers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<Page<UserDTO>>> getAllSubscribers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "userId,asc") String sort) {
        try {
            Page<UserDTO> usersPage = adminService.getAllSubscribers(search, status, page, size, sort);
            return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "Subscribers fetched successfully", usersPage));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ResponseDTO<>("ERROR", e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO<>("ERROR", "Failed to fetch subscribers: " + e.getMessage(), null));
        }
    }

    @PostMapping("/user/{userId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> activateUser(@PathVariable Long userId) {
        try {
            adminService.activateUser(userId);
            return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "User activated successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO<>("ERROR", "Failed to activate user: " + e.getMessage(), null));
        }
    }

    @PostMapping("/user/{userId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deactivateUser(@PathVariable Long userId) {
        try {
            adminService.deactivateUser(userId);
            return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "User deactivated successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO<>("ERROR", "Failed to deactivate user: " + e.getMessage(), null));
        }
    }

    @PostMapping("/user/{userId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> suspendUser(@PathVariable Long userId) {
        try {
            adminService.suspendUser(userId);
            return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "User suspended successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO<>("ERROR", "Failed to suspend user: " + e.getMessage(), null));
        }
    }

    @PostMapping("/check-recharge-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<RechargeStatusResponse>> checkRechargeStatus() {
        try {
            RechargeStatusResponse response = adminService.checkRechargeStatus();
            return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "Recharge status checked", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO<>("ERROR", "Failed to check recharge status: " + e.getMessage(), null));
        }
    }
}