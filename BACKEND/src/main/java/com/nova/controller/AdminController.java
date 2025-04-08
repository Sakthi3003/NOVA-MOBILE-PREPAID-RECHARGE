package com.nova.controller;


import com.nova.DTO.RechargeStatusResponse;
import com.nova.DTO.ResponseDTO;
import com.nova.DTO.UpdateAdminRequest;
import com.nova.DTO.UserDTO;
import com.nova.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @PutMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAdminProfile(HttpServletRequest request, @RequestBody UpdateAdminRequest updateRequest) {
        String token = extractToken(request);
        Map<String, Object> response = adminService.updateAdminProfile(token, updateRequest);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/expiring-plans")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getExpiringPlans(@RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid token");
        }
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("data", adminService.getExpiringPlans());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserDetailsAndTransactions(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid token");
        }
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("data", adminService.getUserDetailsAndTransactions(userId));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/notify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendNotification(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid token");
        }
        String phoneNumber = request.get("phoneNumber");
        String message = request.get("message");
        adminService.sendNotification(phoneNumber, message);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Notification sent successfully");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/subscribers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<Page<UserDTO>>> getAllSubscribers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "userId,asc") String sort) {
        Page<UserDTO> usersPage = adminService.getAllSubscribers(search, status, page, size, sort);
        return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "Subscribers fetched successfully", usersPage));
    }

    @PostMapping("/user/{userId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> activateUser(@PathVariable Long userId) {
        adminService.activateUser(userId);
        return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "User activated successfully", null));
    }

    @PostMapping("/user/{userId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deactivateUser(@PathVariable Long userId) {
        adminService.deactivateUser(userId);
        return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "User deactivated successfully", null));
    }

    @PostMapping("/user/{userId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> suspendUser(@PathVariable Long userId) {
        adminService.suspendUser(userId);
        return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "User suspended successfully", null));
    }

    @PostMapping("/check-recharge-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<RechargeStatusResponse>> checkRechargeStatus() {
        RechargeStatusResponse response = adminService.checkRechargeStatus();
        return ResponseEntity.ok(new ResponseDTO<>("SUCCESS", "Recharge status checked", response));
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("No valid token provided");
        }
        return authHeader.substring(7);
    }
}