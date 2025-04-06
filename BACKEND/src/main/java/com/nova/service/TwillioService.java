package com.nova.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import com.twilio.exception.ApiException;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TwillioService {
    private static final Logger logger = LoggerFactory.getLogger(TwillioService.class);

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    @Value("${twilio.default.country.code:+91}")
    private String defaultCountryCode;

    private static class OtpData {
        private final String otp;
        private final LocalDateTime expiresAt;

        public OtpData(String otp, LocalDateTime expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }

        public String getOtp() {
            return otp;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }
    }
    
    @Scheduled(fixedRate = 60 * 60 * 1000)  // Every 60 minutes
    public void cleanupExpiredOtps() {
        logger.info("Starting OTP store cleanup");
        int initialSize = otpStore.size();
        LocalDateTime now = LocalDateTime.now();
        
        otpStore.entrySet().removeIf(entry -> {
            boolean expired = now.isAfter(entry.getValue().getExpiresAt());
            if (expired) {
                logger.debug("Removing expired OTP for phone: {}", entry.getKey());
            }
            return expired;
        });
        
        logger.info("OTP cleanup completed. Removed {} entries. Current size: {}", 
                   (initialSize - otpStore.size()), otpStore.size());
    }

    private final ConcurrentHashMap<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private boolean isTwilioInitialized = false;

    public TwillioService() {

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

        OtpData otpData = new OtpData(otp, LocalDateTime.now().plusMinutes(5));
        otpStore.put(formattedPhoneNumber, otpData);
        sendOtpSms(formattedPhoneNumber, otp);
        logger.info("OTP generated and sent for phone number: {}. Store size: {}", phoneNumber, otpStore.size());
        return otp;
    }
    

    public boolean verifyOtp(String phoneNumber, String otp) {
        logger.info("Verifying OTP for phone number: {}", phoneNumber);
        String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        OtpData otpData = otpStore.get(formattedPhoneNumber);

        if (otpData == null) {
            logger.warn("No OTP found for phone number: {}", formattedPhoneNumber);
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(otpData.getExpiresAt())) {
            logger.debug("OTP expired for phone number: {}", formattedPhoneNumber);
            otpStore.remove(formattedPhoneNumber);
            return false;
        }

        if (otpData.getOtp().equals(otp)) {
            logger.debug("OTP verified successfully for phone number: {}", formattedPhoneNumber);
            otpStore.remove(formattedPhoneNumber);
            return true;
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