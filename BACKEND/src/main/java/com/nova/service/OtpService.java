package com.nova.service;

import com.nova.entity.Otp;
import com.nova.repository.OtpRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

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

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String twilioPhoneNumber;

    private final OtpRepository otpRepository;

    public OtpService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    public String generateOtp(String phoneNumber) {
        logger.info("Generating OTP for phone number: {}", phoneNumber);
        String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Check if an OTP already exists for this phone number
        Optional<Otp> existingOtp = otpRepository.findByPhoneNumber(formattedPhoneNumber);
        if (existingOtp.isPresent()) {
            logger.debug("Deleting existing OTP for phone number: {}", formattedPhoneNumber);
            otpRepository.deleteByPhoneNumber(formattedPhoneNumber);
        }

        // Store OTP in the database with a 5-minute expiration
        Otp otpEntity = new Otp();
        otpEntity.setPhoneNumber(formattedPhoneNumber);
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

            // Check if OTP is expired
            if (now.isAfter(otpEntity.getExpiresAt())) {
                logger.debug("OTP expired for phone number: {}", formattedPhoneNumber);
                otpRepository.deleteByPhoneNumber(formattedPhoneNumber);
                return false;
            }

            // Verify OTP
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
            Twilio.init(accountSid, authToken);
            String customMessage = "Your Nova login OTP is: " + otp +
                                   ". Please use this OTP to complete your login. Do not share this OTP with anyone.";

            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    customMessage
            ).create();
            logger.info("SMS sent: {}", message.getSid());
        } catch (Exception e) {
            logger.error("Failed to send OTP SMS to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send OTP. Please try again later.");
        }
    }

    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            throw new IllegalArgumentException("Phone number cannot be null or empty");
        }
        if (!phoneNumber.startsWith("+")) {
            return "+91" + phoneNumber;
        }
        return phoneNumber;
    }
}