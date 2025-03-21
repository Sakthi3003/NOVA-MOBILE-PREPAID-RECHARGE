package com.nova.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nova.DTO.UpdateUserRequest;
import com.nova.DTO.UserDetailsResponse;
import com.nova.entity.User;
import com.nova.repository.UserRepository;
import com.nova.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/user")
public class UserController {
	@Autowired
	private UserRepository repo;
	
	private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

   
	
	@GetMapping("/check-number")
	public ResponseEntity<?> checkBNumber(@RequestParam String number) {
	    User user = repo.findByPhoneNumber(number).get();
	    
	    if (user != null) {
	        return ResponseEntity.ok(user); // Return user details if found
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                             .body("User not found with phone number: " + number);
	    }
	}
	
	

	@PutMapping("/update")
    public ResponseEntity<?> updateUser(@Valid @RequestBody UpdateUserRequest updateRequest) {
        try {
            // Update the user
            User updatedUser = userService.updateUser(updateRequest);

            // Convert the updated user to UserDetailsResponse
            UserDetailsResponse userDetails = userService.getUserDetails(updatedUser);

            // Return the updated user details
            return ResponseEntity.ok(userDetails);
        } catch (RuntimeException e) {
            // Handle exceptions (e.g., user not found, email already in use)
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            // Handle unexpected errors
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "An unexpected error occurred while updating the user");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
	
	
	 private String formatPhoneNumber(String phoneNumber) {
	        if (!phoneNumber.startsWith("+")) {
	            return "+91" + phoneNumber;
	        }
	        return phoneNumber;
	    }


}
