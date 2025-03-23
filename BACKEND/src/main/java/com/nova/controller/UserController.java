package com.nova.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nova.DTO.UpdateUserRequest;
import com.nova.DTO.UserDetailsResponse;
import com.nova.entity.Recharge;
import com.nova.entity.User;
import com.nova.repository.RechargeRepository;
import com.nova.repository.UserRepository;
import com.nova.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/user")
public class UserController {
	@Autowired
	private UserRepository repo;
	
	@Autowired RechargeRepository repo1;
	
	private final UserService userService;

    public UserController(UserService userService,RechargeRepository repo1) {
        this.userService = userService;
        this.repo1 = repo1;
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
	            return "" + phoneNumber;
	        }
	        return phoneNumber;
	    }
	 
	 @GetMapping("/plans")
	    public ResponseEntity<?> getUserPlans() {
	        try {
	            // Extract the authenticated user's details from SecurityContextHolder
	            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
	            
	            // Use a temporary variable to determine the username
	            final String username;
	            if (principal instanceof UserDetails) {
	                username = ((UserDetails) principal).getUsername();
	            } else {
	                username = principal.toString();
	            }

	            // Fetch the user by username
	            User user = repo.findByUsername(username)
	                    .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

	            List<Recharge> recharges = repo1.findByUser(user);

	            // Separate active and previous plans
	            Map<String, Object> response = new HashMap<>();
	            LocalDate today = LocalDate.now();

	            // Active plans: Where today's date is between startDate and endDate, and status is "active"
	            List<Map<String, Object>> activePlans = recharges.stream()
	                    .filter(recharge -> recharge.getStatus().equalsIgnoreCase("active") &&
	                            (today.isEqual(recharge.getStartDate()) || today.isAfter(recharge.getStartDate())) &&
	                            (today.isEqual(recharge.getEndDate()) || today.isBefore(recharge.getEndDate())))
	                    .map(recharge -> {
	                        Map<String, Object> planData = new HashMap<>();
	                        planData.put("id", recharge.getRechargeId());
	                        planData.put("name", recharge.getPlan().getName());
	                        planData.put("category", recharge.getPlan().getCategory().getName());
	                        planData.put("price", recharge.getPlan().getPrice());
	                        planData.put("startDate", recharge.getStartDate().toString());
	                        planData.put("endDate", recharge.getEndDate().toString());
	                        planData.put("sms", recharge.getPlan().getSms());
	                        planData.put("calls", recharge.getPlan().getCalls());
	                        planData.put("data", recharge.getPlan().getData());
	                        planData.put("benefits", List.of(
	                                recharge.getPlan().getBenefit1() != null ? recharge.getPlan().getBenefit1() : "",
	                                recharge.getPlan().getBenefit2() != null ? recharge.getPlan().getBenefit2() : ""
	                        ).stream().filter(b -> !b.isEmpty()).collect(Collectors.toList()));
	                        planData.put("status", recharge.getStatus());
	                        return planData;
	                    })
	                    .collect(Collectors.toList());

	            // Previous plans: All plans that are expired or not active
	            List<Map<String, Object>> previousPlans = recharges.stream()
	                    .filter(recharge -> !recharge.getStatus().equalsIgnoreCase("active") ||
	                            today.isAfter(recharge.getEndDate()))
	                    .map(recharge -> {
	                        Map<String, Object> planData = new HashMap<>();
	                        planData.put("id", recharge.getRechargeId());
	                        planData.put("name", recharge.getPlan().getName());
	                        planData.put("category", recharge.getPlan().getCategory().getName());
	                        planData.put("price", recharge.getPlan().getPrice());
	                        planData.put("startDate", recharge.getStartDate().toString());
	                        planData.put("endDate", recharge.getEndDate().toString());
	                        planData.put("sms", recharge.getPlan().getSms());
	                        planData.put("calls", recharge.getPlan().getCalls());
	                        planData.put("data", recharge.getPlan().getData());
	                        planData.put("benefits", List.of(
	                                recharge.getPlan().getBenefit1() != null ? recharge.getPlan().getBenefit1() : "",
	                                recharge.getPlan().getBenefit2() != null ? recharge.getPlan().getBenefit2() : ""
	                        ).stream().filter(b -> !b.isEmpty()).collect(Collectors.toList()));
	                        planData.put("status", recharge.getStatus());
	                        return planData;
	                    })
	                    .collect(Collectors.toList());

	            response.put("activePlans", activePlans);
	            response.put("previousPlans", previousPlans);

	            return ResponseEntity.ok(response);
	        } catch (RuntimeException e) {
	            return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                    .body("User not found with username: " + (e.getMessage().contains("User not found") ? e.getMessage().split(": ")[1] : "unknown"));
	        } catch (Exception e) {
	            Map<String, String> errorResponse = new HashMap<>();
	            errorResponse.put("message", "An unexpected error occurred while fetching plans");
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	        }
	    }



}
