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

    public User updateUser(UpdateUserRequest updateRequest) {
        // Get the authenticated user's identifier from the SecurityContext
        String subject = SecurityContextHolder.getContext().getAuthentication().getName();

        if (subject == null) {
            throw new RuntimeException("No authenticated user found in SecurityContext");
        }

        // Determine if the subject is a phone number or username based on its format
        User user;
        if (isPhoneNumber(subject)) {
            // Subject is a phone number (for users)
        	
            user = userRepository.findByPhoneNumber("+91"+ subject)
                    .orElseThrow(() -> new RuntimeException("User not found with phone number: " + subject));
        } else {
            // Subject is a username (for admins)
            user = userRepository.findByUsername(subject)
                    .orElseThrow(() -> new RuntimeException("User not found with username: " + subject));
        }

        // Validate email uniqueness (if email is being updated)
        if (updateRequest.getEmail() != null && !updateRequest.getEmail().equals(user.getEmail())) {
            Optional<User> existingUserWithEmail = userRepository.findByEmail(updateRequest.getEmail());
            if (existingUserWithEmail.isPresent()) {
                throw new RuntimeException("Email is already in use");
            }
            user.setEmail(updateRequest.getEmail());
        }

        // Save the updated user
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

    // Helper method to determine if the subject is a phone number
    private boolean isPhoneNumber(String subject) {
        // A simple check: phone numbers typically contain digits and may start with +
        return subject.matches("\\+?\\d+");
    }
}