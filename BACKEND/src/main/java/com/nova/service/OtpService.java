package com.nova.service;

import com.nova.entity.Otp;
import com.nova.repository.OtpRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import com.twilio.exception.ApiException;

import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class OtpService {
    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    @Value("${twilio.default.country.code:+91}")
    private String defaultCountryCode;

    private final OtpRepository otpRepository;
    
    private boolean isTwilioInitialized = false;

    public OtpService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    @PostConstruct
    public void initTwilio() {
        try {
            logger.info("Twilio credentials - Account SID: {}, Auth Token: {}, Phone Number: {}", 
                        accountSid, authToken, twilioPhoneNumber);
            if (accountSid.isEmpty() || authToken.isEmpty()) {
                logger.error("Twilio credentials are not set. Account SID: {}, Auth Token: {}", accountSid, authToken);
                throw new IllegalStateException("Twilio Account SID and Auth Token must be set in application.properties");
            }
            Twilio.init(accountSid, authToken);
            isTwilioInitialized = true;
            logger.info("Twilio initialized successfully with Account SID: {}", accountSid);
        } catch (Exception e) {
            logger.error("Failed to initialize Twilio: {}", e.getMessage(), e);
            throw new RuntimeException("Twilio initialization failed: " + e.getMessage());
        }
    }

    private void ensureTwilioInitialized() {
        if (!isTwilioInitialized) {
            logger.warn("Twilio is not initialized. Attempting to reinitialize...");
            initTwilio();
        }
    }

    public String generateOtp(String phoneNumber) {
        logger.info("Generating OTP for phone number: {}", phoneNumber);
        String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        String otp = String.format("%06d", new Random().nextInt(999999));

        Optional<Otp> existingOtp = otpRepository.findByPhoneNumber(formattedPhoneNumber);
        Otp otpEntity;
        if (existingOtp.isPresent()) {
            logger.debug("Updating existing OTP for phone number: {}", formattedPhoneNumber);
            otpEntity = existingOtp.get();
        } else {
            otpEntity = new Otp();
            otpEntity.setPhoneNumber(formattedPhoneNumber);
        }
        otpEntity.setOtp(otp);
        otpEntity.setCreatedAt(LocalDateTime.now());
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otpRepository.save(otpEntity);

        sendOtpSms(formattedPhoneNumber, otp);
        logger.info("OTP generated and sent for phone number: {}", phoneNumber);
        return otp;
    }

    public boolean verifyOtp(String phoneNumber, String otp) {
        logger.info("Verifying OTP for phone number: {}", phoneNumber);
        String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        Optional<Otp> otpEntityOptional = otpRepository.findByPhoneNumber(formattedPhoneNumber);

        if (otpEntityOptional.isPresent()) {
            Otp otpEntity = otpEntityOptional.get();
            LocalDateTime now = LocalDateTime.now();

            if (now.isAfter(otpEntity.getExpiresAt())) {
                logger.debug("OTP expired for phone number: {}", formattedPhoneNumber);
                otpRepository.deleteByPhoneNumber(formattedPhoneNumber);
                return false;
            }

            if (otpEntity.getOtp().equals(otp)) {
                logger.debug("OTP verified successfully for phone number: {}", formattedPhoneNumber);
                otpRepository.deleteByPhoneNumber(formattedPhoneNumber);
                return true;
            }
        }

        logger.warn("OTP verification failed for phone number: {}", phoneNumber);
        return false;
    }

    private void sendOtpSms(String phoneNumber, String otp) {
        try {
            String customMessage = "Your Nova login OTP is: " + otp +
                                   ". Please use this OTP to complete your login. Do not share this OTP with anyone.";
            sendSms(phoneNumber, customMessage);
        } catch (Exception e) {
            logger.error("Failed to send OTP SMS to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send OTP: " + e.getMessage());
        }
    }

    public void sendSms(String phoneNumber, String message) {
        try {
            ensureTwilioInitialized();

            if (twilioPhoneNumber.isEmpty()) {
                logger.error("Twilio phone number is not set.");
                throw new IllegalStateException("Twilio phone number must be set in application.properties");
            }

            String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
            logger.info("Sending SMS to: {}, From: {}, Message: {}", formattedPhoneNumber, twilioPhoneNumber, message);

            Message msg = Message.creator(
                    new PhoneNumber(formattedPhoneNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    message
            ).create();

            logger.info("SMS sent successfully. SID: {}", msg.getSid());
        } catch (ApiException e) {
            logger.error("Twilio API error: Code: {}, Message: {}, More Info: {}", 
                e.getCode(), e.getMessage(), e.getMoreInfo());
            throw new RuntimeException("Failed to send SMS: " + e.getMessage() + " (Code: " + e.getCode() + ")");
        } catch (Exception e) {
            logger.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS: " + e.getMessage());
        }
    }

    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            logger.error("Phone number is null or empty");
            throw new IllegalArgumentException("Phone number cannot be null or empty");
        }
        String cleanedPhoneNumber = phoneNumber.replaceAll("[^0-9+]", "");
        if (!cleanedPhoneNumber.startsWith("+")) {
            String formatted = defaultCountryCode + cleanedPhoneNumber;
            logger.debug("Formatted phone number: {} to {}", phoneNumber, formatted);
            return formatted;
        }
        logger.debug("Phone number already formatted: {}", phoneNumber);
        return cleanedPhoneNumber;
    }
}