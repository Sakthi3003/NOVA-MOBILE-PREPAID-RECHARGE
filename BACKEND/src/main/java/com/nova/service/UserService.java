package com.nova.service;

import com.nova.DTO.UpdateUserRequest;
import com.nova.DTO.UserDetailsResponse;
import com.nova.entity.User;
import com.nova.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(UpdateUserRequest updateRequest) {
        String subject = SecurityContextHolder.getContext().getAuthentication().getName();

        if (subject == null) {
            throw new RuntimeException("No authenticated user found in SecurityContext");
        }

        User user;
        if (isPhoneNumber(subject)) {
        	
            user = userRepository.findByPhoneNumber("+91"+ subject)
                    .orElseThrow(() -> new RuntimeException("User not found with phone number: " + subject));
        } else {
            user = userRepository.findByUsername(subject)
                    .orElseThrow(() -> new RuntimeException("User not found with username: " + subject));
        }

        if (updateRequest.getEmail() != null && !updateRequest.getEmail().equals(user.getEmail())) {
            Optional<User> existingUserWithEmail = userRepository.findByEmail(updateRequest.getEmail());
            if (existingUserWithEmail.isPresent()) {
                throw new RuntimeException("Email is already in use");
            }
            user.setEmail(updateRequest.getEmail());
        }
        return userRepository.save(user);
    }

    public UserDetailsResponse getUserDetails(User user) {
        UserDetailsResponse userDetails = new UserDetailsResponse();
        userDetails.setFirstName(user.getFirstName());
        userDetails.setLastName(user.getLastName());
        userDetails.setEmail(user.getEmail());
        userDetails.setPhoneNumber(user.getPhoneNumber());
        userDetails.setAddress(user.getAddress());
        userDetails.setActivationDate(user.getActivationDate());
        userDetails.setStatus(user.getStatus());
        return userDetails;
    }
    private boolean isPhoneNumber(String subject) {
        // A simple check: phone numbers typically contain digits and may start with +
        return subject.matches("\\+?\\d+");
    }
}