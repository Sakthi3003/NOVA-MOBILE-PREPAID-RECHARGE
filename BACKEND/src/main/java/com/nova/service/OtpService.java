package com.nova.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {
    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String twilioPhoneNumber;

    private final ConcurrentHashMap<String, String> otpStore = new ConcurrentHashMap<>();

    public String generateOtp(String phoneNumber) {
        String formattedPhoneNumber = formatPhoneNumber(phoneNumber); 
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(formattedPhoneNumber, otp); // Store with country code
        new Thread(() -> {
            try {
                TimeUnit.MINUTES.sleep(5);
                otpStore.remove(formattedPhoneNumber);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
        sendOtpSms(formattedPhoneNumber, otp);
        return otp;
    }

    public boolean verifyOtp(String phoneNumber, String otp) {
        String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        String storedOtp = otpStore.get(formattedPhoneNumber);
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpStore.remove(formattedPhoneNumber);
            return true;
        }
        return false;
    }

    private void sendOtpSms(String phoneNumber, String otp) {
        Twilio.init(accountSid, authToken);
        Message message = Message.creator(
                new PhoneNumber(phoneNumber),
                new PhoneNumber(twilioPhoneNumber),
                "Your OTP is: " + otp
        ).create();
        System.out.println("SMS sent: " + message.getSid());
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