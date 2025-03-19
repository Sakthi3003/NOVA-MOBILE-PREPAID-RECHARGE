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
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlanService {
 @Autowired
 private PlanRepository planRepository;
 
 @Autowired
 private CategoryRepository categoryRepository;
 
 public List<PlanDTO> getAllPlans() {
     return planRepository.findAll().stream()
             .map(this::convertToDTO)
             .collect(Collectors.toList());
 }
 
 public PlanDTO getPlanById(Long id) {
     Plan plan = planRepository.findById(id)
             .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
     return convertToDTO(plan);
 }
 
 public PlanDTO createPlan(PlanCreateDTO planCreateDTO) {
     Category category = categoryRepository.findById(planCreateDTO.getCategoryId())
             .orElseThrow(() -> new RuntimeException("Category not found with id: " + planCreateDTO.getCategoryId()));
     
     Plan plan = new Plan();
     plan.setCategory(category);
     plan.setName(planCreateDTO.getName());
     plan.setPrice(planCreateDTO.getPrice());
     plan.setValidity(planCreateDTO.getValidity());
     plan.setData(planCreateDTO.getData());
     plan.setSms(planCreateDTO.getSms());
     plan.setCalls(planCreateDTO.getCalls());
     plan.setBenefit1(planCreateDTO.getBenefit1());
     plan.setBenefit2(planCreateDTO.getBenefit2());
     plan.setStatus("active");
     
     Plan savedPlan = planRepository.save(plan);
     return convertToDTO(savedPlan);
 }
 
 public PlanDTO updatePlan(PlanUpdateDTO planUpdateDTO) {
     Plan plan = planRepository.findById(planUpdateDTO.getId())
             .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planUpdateDTO.getId()));
     
     if (planUpdateDTO.getCategoryId() != null) {
         Category category = categoryRepository.findById(planUpdateDTO.getCategoryId())
                 .orElseThrow(() -> new RuntimeException("Category not found with id: " + planUpdateDTO.getCategoryId()));
         plan.setCategory(category);
     }
     
     if (planUpdateDTO.getName() != null) plan.setName(planUpdateDTO.getName());
     if (planUpdateDTO.getPrice() != null) plan.setPrice(planUpdateDTO.getPrice());
     if (planUpdateDTO.getValidity() != null) plan.setValidity(planUpdateDTO.getValidity());
     if (planUpdateDTO.getData() != null) plan.setData(planUpdateDTO.getData());
     if (planUpdateDTO.getSms() != null) plan.setSms(planUpdateDTO.getSms());
     if (planUpdateDTO.getCalls() != null) plan.setCalls(planUpdateDTO.getCalls());
     if (planUpdateDTO.getBenefit1() != null) plan.setBenefit1(planUpdateDTO.getBenefit1());
     if (planUpdateDTO.getBenefit2() != null) plan.setBenefit2(planUpdateDTO.getBenefit2());
     if (planUpdateDTO.getStatus() != null) plan.setStatus(planUpdateDTO.getStatus());
     
     Plan updatedPlan = planRepository.save(plan);
     return convertToDTO(updatedPlan);
 }
 
 public void deletePlan(Long id) {
     planRepository.deleteById(id);
 }
 
 public PlanDTO togglePlanStatus(Long id) {
     Plan plan = planRepository.findById(id)
             .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
     
     plan.setStatus(plan.getStatus().equals("active") ? "inactive" : "active");
     Plan updatedPlan = planRepository.save(plan);
     return convertToDTO(updatedPlan);
 }
 
 private PlanDTO convertToDTO(Plan plan) {
     PlanDTO planDTO = new PlanDTO();
     planDTO.setId(plan.getId());
     
     if (plan.getCategory() != null) {
         CategoryDTO categoryDTO = new CategoryDTO();
         categoryDTO.setId(plan.getCategory().getId());
         categoryDTO.setName(plan.getCategory().getName());
         planDTO.setCategory(categoryDTO);
     }
     
     planDTO.setName(plan.getName());
     planDTO.setPrice(plan.getPrice());
     planDTO.setValidity(plan.getValidity());
     planDTO.setData(plan.getData());
     planDTO.setSms(plan.getSms());
     planDTO.setCalls(plan.getCalls());
     planDTO.setBenefit1(plan.getBenefit1());
     planDTO.setBenefit2(plan.getBenefit2());
     planDTO.setStatus(plan.getStatus());
     
     return planDTO;
 }
}