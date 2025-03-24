package com.nova.service;

import com.nova.repository.OtpRepository;

import jakarta.transaction.Transactional;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class OtpCleanupTask {
    private final OtpRepository otpRepository;

    public OtpCleanupTask(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteAll(otpRepository.findAll().stream()
                .filter(otp -> LocalDateTime.now().isAfter(otp.getExpiresAt()))
                .toList());
    }
}