package com.nova.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nova.entity.User;
import com.nova.repository.UserRepository;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/subscriber")
public class SubscriberController {
	@Autowired
	private UserRepository repo;
	
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


}
