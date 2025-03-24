package com.nova.controller;

import com.nova.DTO.PlanCreateDTO;
import com.nova.DTO.PlanDTO;
import com.nova.DTO.PlanUpdateDTO;
import com.nova.service.PlanService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/plans")
public class PlanController {
    private static final Logger logger = LoggerFactory.getLogger(PlanController.class);

    @Autowired
    private PlanService planService;

    @GetMapping
    public ResponseEntity<Page<PlanDTO>> getAllPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        logger.info("Fetching all plans - page: {}, size: {}, search: {}, status: {}, sortBy: {}, sortDir: {}",
                page, size, search, status, sortBy, sortDir);
        Page<PlanDTO> plans = planService.getAllPlans(page, size, search, status, sortBy, sortDir);
        logger.debug("Retrieved {} plans", plans.getTotalElements());
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanDTO> getPlanById(@PathVariable Long id) {
        logger.info("Fetching plan with ID: {}", id);
        PlanDTO plan = planService.getPlanById(id);
        logger.debug("Retrieved plan: {}", plan.getName());
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanDTO> createPlan(@Valid @RequestBody PlanCreateDTO planCreateDTO) {
        logger.info("Creating new plan: {}", planCreateDTO.getName());
        PlanDTO createdPlan = planService.createPlan(planCreateDTO);
        logger.info("Plan created successfully with ID: {}", createdPlan.getId());
        return ResponseEntity.ok(createdPlan);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanDTO> updatePlan(@PathVariable Long id, @Valid @RequestBody PlanUpdateDTO planUpdateDTO) {
        logger.info("Updating plan with ID: {}, data: {}", id, planUpdateDTO.getName());
        planUpdateDTO.setId(id); // Ensure ID matches path variable
        PlanDTO updatedPlan = planService.updatePlan(planUpdateDTO);
        logger.info("Plan updated successfully: {}", updatedPlan.getName());
        return ResponseEntity.ok(updatedPlan);
    }

 

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanDTO> togglePlanStatus(@PathVariable Long id) {
        logger.info("Toggling status for plan with ID: {}", id);
        PlanDTO updatedPlan = planService.togglePlanStatus(id);
        logger.info("Plan status toggled successfully: {}", updatedPlan.getStatus());
        return ResponseEntity.ok(updatedPlan);
    }
}