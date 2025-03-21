package com.nova.controller;

import com.nova.DTO.AuthRequest;
import com.nova.DTO.AuthResponse;
import com.nova.entity.Otp;
import com.nova.entity.Role;
import com.nova.DTO.OtpVerify;
import com.nova.entity.User;
import com.nova.repository.RoleRepository;
import com.nova.repository.UserRepository;
import com.nova.security.JwtUtil;
import com.nova.service.OtpService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDetailsService userDetailsService;
    private final OtpService otpService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                          UserRepository userRepository, RoleRepository roleRepository,
                          PasswordEncoder passwordEncoder, UserDetailsService userDetailsService,
                          OtpService otpService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDetailsService = userDetailsService;
        this.otpService = otpService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) throws Exception {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.getUsername());
        User user = userRepository.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new Exception("User not found with username: " + authRequest.getUsername()));

        List<String> roles = user.getRoles().stream()
                .map(Role::getRoleName)
                .filter(role -> role.equals("ADMIN") || role.equals("USER"))
                .collect(Collectors.toList());

        if (roles.isEmpty()) {
            throw new Exception("No valid roles (ADMIN or USER) assigned to user: " + authRequest.getUsername());
        }

        String accessToken = jwtUtil.generateToken(userDetails.getUsername(), roles);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), roles);
        String responseRole = roles.contains("ADMIN") ? "ADMIN" : "USER";

        // Include user details in the response
        Map<String, Object> response = new HashMap<>();
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
            put("password",user.getPassword());
        }});

        return ResponseEntity.ok(response);
    }

 // 1. Send OTP (Updated to return JSON)
    @PostMapping("/otp/request")
    public ResponseEntity<Map<String, Object>> requestOtp(@RequestBody Otp otp) throws Exception {
        String formattedPhoneNumber = formatPhoneNumber(otp.getPhoneNumber());
        User user = userRepository.findByPhoneNumber(otp.getPhoneNumber())
                .orElseThrow(() -> new Exception("Phone number not registered: " + otp.getPhoneNumber()));
        otpService.generateOtp(otp.getPhoneNumber());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "OTP sent to " + formattedPhoneNumber);
        return ResponseEntity.ok(response);
    }

    // 2. Verify OTP (Updated to include user_id and user details)
    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerify verifyRequest) throws Exception {
        if (otpService.verifyOtp(verifyRequest.getPhoneNumber(), verifyRequest.getOtp())) {
            User user = userRepository.findByPhoneNumber(verifyRequest.getPhoneNumber())
                    .orElseThrow(() -> new Exception("User not found with phone number: " + verifyRequest.getPhoneNumber()));
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            List<String> roles = user.getRoles().stream()
                    .map(Role::getRoleName)
                    .filter(role -> role.equals("ADMIN") || role.equals("USER"))
                    .collect(Collectors.toList());

            if (roles.isEmpty()) {
                throw new Exception("No valid roles (ADMIN or USER) assigned to user with phone: " + verifyRequest.getPhoneNumber());
            }

            String accessToken = jwtUtil.generateToken(userDetails.getUsername(), roles);
            String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), roles);
            String responseRole = roles.contains("ADMIN") ? "ADMIN" : "USER";

            // Include user details in the response
            Map<String, Object> response = new HashMap<>();
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

            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid OTP"));
    }

    private String formatPhoneNumber(String phoneNumber) {
        if (!phoneNumber.startsWith("+")) {
            return "+91" + phoneNumber;
        }
        return phoneNumber;
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        jwtUtil.invalidateToken(token);
        return ResponseEntity.ok("Logged out successfully");
    }
}