package com.nova.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private TwillioService twillioService;

    public void sendNotification(String phoneNumber, String message) {
        logger.info("Sending notification to phone number: {}", phoneNumber);
        try {
            twillioService.sendSms(phoneNumber, message);
            logger.info("Notification sent successfully to {}", phoneNumber);
        } catch (Exception e) {
            logger.error("Failed to send notification to {}: {}", phoneNumber, e.getMessage());
            throw e;
        }
    }
}