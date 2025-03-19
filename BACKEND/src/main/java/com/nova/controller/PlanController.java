package com.nova.controller;

import com.nova.DTO.PlanCreateDTO;
import com.nova.DTO.PlanDTO;
import com.nova.DTO.PlanUpdateDTO;
import com.nova.service.PlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
public class PlanController {
    @Autowired
    private PlanService planService;
    
    @GetMapping
    public ResponseEntity<List<PlanDTO>> getAllPlans() {
        return ResponseEntity.ok(planService.getAllPlans());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PlanDTO> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(planService.getPlanById(id));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanDTO> createPlan(@RequestBody PlanCreateDTO planCreateDTO) {
        return ResponseEntity.ok(planService.createPlan(planCreateDTO));
    }
    
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanDTO> updatePlan(@RequestBody PlanUpdateDTO planUpdateDTO) {
        return ResponseEntity.ok(planService.updatePlan(planUpdateDTO));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok().build();
    }
    
    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanDTO> togglePlanStatus(@PathVariable Long id) {
        return ResponseEntity.ok(planService.togglePlanStatus(id));
    }
}