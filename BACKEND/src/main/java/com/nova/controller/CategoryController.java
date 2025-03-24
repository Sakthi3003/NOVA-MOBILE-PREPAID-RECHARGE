package com.nova.controller;

import com.nova.DTO.CategoryDTO;
import com.nova.service.CategoryService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        logger.info("Fetching all categories");
        List<CategoryDTO> categories = categoryService.getAllCategories();
        logger.debug("Retrieved {} categories", categories.size());
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        logger.info("Fetching category with ID: {}", id);
        CategoryDTO category = categoryService.getCategoryById(id);
        logger.debug("Retrieved category: {}", category.getName());
        return ResponseEntity.ok(category);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryDTO> createCategory(@Valid @RequestBody CategoryDTO categoryDTO) {
        logger.info("Creating category with name: {}", categoryDTO.getName());
        CategoryDTO createdCategory = categoryService.createCategory(categoryDTO);
        logger.info("Category created successfully with ID: {}", createdCategory.getId());
        return ResponseEntity.ok(createdCategory);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryDTO categoryDTO) {
        logger.info("Updating category with ID: {}, name: {}", id, categoryDTO.getName());
        categoryDTO.setId(id);
        CategoryDTO updatedCategory = categoryService.updateCategory(categoryDTO);
        logger.info("Category updated successfully: {}", updatedCategory.getName());
        return ResponseEntity.ok(updatedCategory);
    }


}