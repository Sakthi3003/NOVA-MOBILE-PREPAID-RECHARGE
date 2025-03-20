package com.nova.service;

import com.nova.DTO.CategoryDTO;
import com.nova.DTO.PlanCreateDTO;
import com.nova.DTO.PlanDTO;
import com.nova.DTO.PlanUpdateDTO;
import com.nova.entity.Category;
import com.nova.entity.Plan;
import com.nova.repository.CategoryRepository;
import com.nova.repository.PlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class PlanService {
    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Page<PlanDTO> getAllPlans(int page, int size, String search, String status, String sortBy, String sortDir) {
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Plan> plansPage = planRepository.findAllWithSearch(search, status, pageable);
        return plansPage.map(this::convertToDTO);
    }

    public PlanDTO getPlanById(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        return convertToDTO(plan);
    }

    public PlanDTO createPlan(PlanCreateDTO planCreateDTO) {
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
                .orElseThrow(() -> new RuntimeException("Category not found"));
        plan.setCategory(category);

        Plan savedPlan = planRepository.save(plan);
        return convertToDTO(savedPlan);
    }

    public PlanDTO updatePlan(PlanUpdateDTO planUpdateDTO) {
        Plan plan = planRepository.findById(planUpdateDTO.getId())
                .orElseThrow(() -> new RuntimeException("Plan not found"));

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
                .orElseThrow(() -> new RuntimeException("Category not found"));
        plan.setCategory(category);

        Plan updatedPlan = planRepository.save(plan);
        return convertToDTO(updatedPlan);
    }

    public void deletePlan(Long id) {
        planRepository.deleteById(id);
    }

    public PlanDTO togglePlanStatus(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        plan.setStatus(plan.getStatus().equals("active") ? "inactive" : "active");
        Plan updatedPlan = planRepository.save(plan);
        return convertToDTO(updatedPlan);
    }

    private PlanDTO convertToDTO(Plan plan) {
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