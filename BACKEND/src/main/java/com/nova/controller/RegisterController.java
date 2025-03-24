package com.nova.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.nova.entity.User;
import com.nova.entity.Role;
import com.nova.repository.RoleRepository;
import com.nova.repository.UserRepository;

import jakarta.validation.Valid;
import java.sql.Date;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class RegisterController {
    private static final Logger logger = LoggerFactory.getLogger(RegisterController.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public RegisterController(UserRepository userRepository, RoleRepository roleRepository,
                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody User userRequest) {
        logger.info("Registration attempt for username: {}", userRequest.getUsername());

        if (userRepository.findByUsername(userRequest.getUsername()).isPresent()) {
            logger.warn("Username already exists: {}", userRequest.getUsername());
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
        }

        User user = new User();
        user.setUsername(userRequest.getUsername());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setFirstName(userRequest.getFirstName());
        user.setLastName(userRequest.getLastName());
        user.setPhoneNumber(userRequest.getPhoneNumber());
        user.setEmail(userRequest.getEmail());
        user.setAddress(userRequest.getAddress());
        user.setActivationDate(Date.valueOf(LocalDate.now()));
        user.setStatus("active");

        Set<Role> roles = new HashSet<>();
        String roleType = userRequest.getRoles() != null && userRequest.getRoles().stream()
                .anyMatch(role -> role.getRoleName().equalsIgnoreCase("ADMIN")) ? "ADMIN" : "USER";

        if ("ADMIN".equals(roleType)) {
            Role adminRole = roleRepository.findById(1L)
                    .orElseThrow(() -> {
                        logger.error("ADMIN role not found in database");
                        return new RuntimeException("ADMIN role not found");
                    });
            roles.add(adminRole);
        } else {
            Role userRole = roleRepository.findById(2L)
                    .orElseThrow(() -> {
                        logger.error("USER role not found in database");
                        return new RuntimeException("USER role not found");
                    });
            roles.add(userRole);
        }
        user.setRoles(roles);

        logger.debug("Saving user with roles: {}", roles.stream().map(Role::getRoleName).toList());
        userRepository.save(user);

        logger.info("User registered successfully with role: {}", roleType);
        return ResponseEntity.ok("User registered successfully with role: " + roleType);
    }
}