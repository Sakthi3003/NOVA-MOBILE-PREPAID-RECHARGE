package com.nova.controller;

import com.nova.DTO.AuthRequest;
import com.nova.DTO.AuthResponse;
import com.nova.entity.Otp;
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

import java.util.List;
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
                .orElseThrow(() -> new Exception("admin not found with username: " + authRequest.getUsername()));

        List<String> roles = user.getRoles().stream()
                .map(roleObj -> roleObj.getRoleName())
                .filter(role -> role.equals("ADMIN") || role.equals("USER"))
                .collect(Collectors.toList());

        if (roles.isEmpty()) {
            throw new Exception("No valid roles (ADMIN or USER) assigned to user: " + authRequest.getUsername());
        }

        String accessToken = jwtUtil.generateToken(userDetails.getUsername(), roles);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), roles);

        String responseRole = roles.contains("ADMIN") ? "ADMIN" : "USER";
        return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken, responseRole));
    }

    @PostMapping("/otp/request")
    public ResponseEntity<String> requestOtp(@RequestBody Otp otp) throws Exception {
        String formattedPhoneNumber = formatPhoneNumber(otp.getPhoneNumber());
        User user = userRepository.findByPhoneNumber(otp.getPhoneNumber())
                .orElseThrow(() -> new Exception("Phone number not registered: " + otp.getPhoneNumber()));
        otpService.generateOtp(otp.getPhoneNumber());
        return ResponseEntity.ok("OTP sent to " + formattedPhoneNumber);
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerify verifyRequest) throws Exception {
        if (otpService.verifyOtp(verifyRequest.getPhoneNumber(), verifyRequest.getOtp())) {
            User user = userRepository.findByPhoneNumber(verifyRequest.getPhoneNumber())
                    .orElseThrow(() -> new Exception("User not found with phone number: " + verifyRequest.getPhoneNumber()));
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            List<String> roles = user.getRoles().stream()
                    .map(roleObj -> roleObj.getRoleName())
                    .filter(role -> role.equals("ADMIN") || role.equals("USER"))
                    .collect(Collectors.toList());

            if (roles.isEmpty()) {
                throw new Exception("No valid roles (ADMIN or USER) assigned to user with phone: " + verifyRequest.getPhoneNumber());
            }

            String accessToken = jwtUtil.generateToken(userDetails.getUsername(), roles);
            String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), roles);
            String responseRole = roles.contains("ADMIN") ? "ADMIN" : "USER";
            return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken, responseRole));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP");
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