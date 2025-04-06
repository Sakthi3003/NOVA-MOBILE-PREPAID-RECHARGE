package com.nova.exception;

public class PlanNotFoundException extends RuntimeException {
    public PlanNotFoundException(Long id) {
        super("Plan not found with id: " + id);
    }
}