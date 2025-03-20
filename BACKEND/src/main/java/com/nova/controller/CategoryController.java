package com.nova.controller;

import com.nova.DTO.CategoryDTO;
import com.nova.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*")
@RestController
@RequestMapping("/api/categories")

public class CategoryController {
 @Autowired
 private CategoryService categoryService;
 
 @GetMapping
 public ResponseEntity<List<CategoryDTO>> getAllCategories() {
     return ResponseEntity.ok(categoryService.getAllCategories());
 }
 
 @GetMapping("/{id}")
 public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
     return ResponseEntity.ok(categoryService.getCategoryById(id));
 }
 
 @PostMapping
 @PreAuthorize("hasRole('ADMIN')")
 public ResponseEntity<CategoryDTO> createCategory(@RequestBody CategoryDTO categoryDTO) {
     return ResponseEntity.ok(categoryService.createCategory(categoryDTO));
 }
 
 @PutMapping("/{id}")
 @PreAuthorize("hasRole('ADMIN')")
 public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @RequestBody CategoryDTO categoryDTO) {
     categoryDTO.setId(id);
     return ResponseEntity.ok(categoryService.updateCategory(categoryDTO));
 }
 
 @DeleteMapping("/{id}")
 @PreAuthorize("hasRole('ADMIN')")
 public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
     categoryService.deleteCategory(id);
     return ResponseEntity.ok().build();
 }
}