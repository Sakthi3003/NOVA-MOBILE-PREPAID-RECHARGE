package com.nova.service;

import com.nova.DTO.CategoryDTO;
import com.nova.DTO.PlanCreateDTO;
import com.nova.DTO.PlanDTO;
import com.nova.DTO.PlanUpdateDTO;
import com.nova.entity.Category;
import com.nova.entity.Plan;
import com.nova.repository.CategoryRepository;
import com.nova.repository.PlanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PlanService {
    private static final Logger logger = LoggerFactory.getLogger(PlanService.class);

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Optional<Plan> findById(Long planId) {
        logger.info("Fetching plan by id: {}", planId);
        Optional<Plan> plan = planRepository.findById(planId);
        if (plan.isEmpty()) {
            logger.warn("Plan not found with id: {}", planId);
            throw new RuntimeException("Plan not found with id: " + planId);
        }
        logger.debug("Found plan: {}", plan.get().getName());
        return plan;
    }

    public Plan save(Plan plan) {
        logger.info("Saving plan: {}", plan.getName());
        Plan savedPlan = planRepository.save(plan);
        logger.info("Successfully saved plan: {}", savedPlan.getName());
        return savedPlan;
    }

    public Page<PlanDTO> getAllPlans(int page, int size, String search, String status, String sortBy, String sortDir) {
        logger.info("Fetching plans - page: {}, size: {}, search: {}, status: {}, sortBy: {}, sortDir: {}",
                page, size, search, status, sortBy, sortDir);

        if (page < 0) {
            logger.warn("Invalid page number: {}", page);
            throw new IllegalArgumentException("Page number cannot be less than 0");
        }
        if (size <= 0) {
            logger.warn("Invalid page size: {}", size);
            throw new IllegalArgumentException("Page size must be greater than 0");
        }

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Plan> plansPage = planRepository.findAllWithSearch(search, status, pageable);
        if (plansPage.isEmpty()) {
            logger.warn("No plans found for search: {}, status: {}", search, status);
            throw new RuntimeException("No plans found for the given criteria");
        }

        Page<PlanDTO> planDTOPage = plansPage.map(this::convertToDTO);
        logger.debug("Retrieved {} plans across {} pages", planDTOPage.getTotalElements(), planDTOPage.getTotalPages());
        logger.info("Successfully fetched plans for page: {}", page);
        return planDTOPage;
    }

    public PlanDTO getPlanById(Long id) {
        logger.info("Fetching plan by id: {}", id);
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Plan not found with id: {}", id);
                    return new RuntimeException("Plan not found with id: " + id);
                });
        logger.debug("Found plan: {}", plan.getName());
        return convertToDTO(plan);
    }

    public PlanDTO createPlan(PlanCreateDTO planCreateDTO) {
        logger.info("Creating plan with name: {}", planCreateDTO.getName());
        
        Plan plan = new Plan();
        plan.setName(planCreateDTO.getName());
        plan.setPrice(planCreateDTO.getPrice());
        plan.setValidity(planCreateDTO.getValidity());
        plan.setData(planCreateDTO.getData());
        plan.setSms(planCreateDTO.getSms());
        plan.setCalls(planCreateDTO.getCalls());
        plan.setBenefit1(planCreateDTO.getBenefit1());
        plan.setBenefit2(planCreateDTO.getBenefit2());
        plan.setStatus("active");

        Category category = categoryRepository.findById(planCreateDTO.getCategoryId())
                .orElseThrow(() -> {
                    logger.warn("Category not found with id: {}", planCreateDTO.getCategoryId());
                    return new RuntimeException("Category not found with id: " + planCreateDTO.getCategoryId());
                });
        plan.setCategory(category);

        Plan savedPlan = save(plan);
        logger.info("Successfully created plan: {}", savedPlan.getName());
        return convertToDTO(savedPlan);
    }

    public PlanDTO updatePlan(PlanUpdateDTO planUpdateDTO) {
        logger.info("Updating plan with id: {}", planUpdateDTO.getId());
        
        Plan plan = planRepository.findById(planUpdateDTO.getId())
                .orElseThrow(() -> {
                    logger.warn("Plan not found with id: {}", planUpdateDTO.getId());
                    return new RuntimeException("Plan not found with id: " + planUpdateDTO.getId());
                });

        plan.setName(planUpdateDTO.getName());
        plan.setPrice(planUpdateDTO.getPrice());
        plan.setValidity(planUpdateDTO.getValidity());
        plan.setData(planUpdateDTO.getData());
        plan.setSms(planUpdateDTO.getSms());
        plan.setCalls(planUpdateDTO.getCalls());
        plan.setBenefit1(planUpdateDTO.getBenefit1());
        plan.setBenefit2(planUpdateDTO.getBenefit2());
        plan.setStatus(planUpdateDTO.getStatus());

        Category category = categoryRepository.findById(planUpdateDTO.getCategoryId())
                .orElseThrow(() -> {
                    logger.warn("Category not found with id: {}", planUpdateDTO.getCategoryId());
                    return new RuntimeException("Category not found with id: " + planUpdateDTO.getCategoryId());
                });
        plan.setCategory(category);

        Plan updatedPlan = save(plan);
        logger.info("Successfully updated plan: {}", updatedPlan.getName());
        return convertToDTO(updatedPlan);
    }


    public PlanDTO togglePlanStatus(Long id) {
        logger.info("Toggling status for plan with id: {}", id);
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Plan not found with id: {}", id);
                    return new RuntimeException("Plan not found with id: " + id);
                });
        plan.setStatus(plan.getStatus().equals("active") ? "inactive" : "active");
        Plan updatedPlan = save(plan);
        logger.info("Successfully toggled plan status to: {}", updatedPlan.getStatus());
        return convertToDTO(updatedPlan);
    }

    private PlanDTO convertToDTO(Plan plan) {
        logger.debug("Converting plan to DTO: {}", plan.getName());
        PlanDTO planDTO = new PlanDTO();
        planDTO.setId(plan.getId());
        planDTO.setName(plan.getName());
        planDTO.setPrice(plan.getPrice());
        planDTO.setValidity(plan.getValidity());
        planDTO.setData(plan.getData());
        planDTO.setSms(plan.getSms());
        planDTO.setCalls(plan.getCalls());
        planDTO.setBenefit1(plan.getBenefit1());
        planDTO.setBenefit2(plan.getBenefit2());
        planDTO.setStatus(plan.getStatus());

        if (plan.getCategory() != null) {
            CategoryDTO categoryDTO = new CategoryDTO();
            categoryDTO.setId(plan.getCategory().getId());
            categoryDTO.setName(plan.getCategory().getName());
            planDTO.setCategory(categoryDTO);
        }
        return planDTO;
    }
}