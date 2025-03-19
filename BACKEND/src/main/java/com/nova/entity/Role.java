package com.nova.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    // Getters and Setters
    public Long getRoleId() { return id; }
    public void setRoleId(Long roleId) { this.id = roleId; }
    public String getRoleName() { return name; }
    public void setRoleName(String roleName) { this.name = roleName; }
}