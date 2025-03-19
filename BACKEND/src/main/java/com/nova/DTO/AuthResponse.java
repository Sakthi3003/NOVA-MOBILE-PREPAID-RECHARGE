package com.nova.DTO;

public class AuthResponse {
    private final String accessToken;
    private final String refreshToken;
    private final String role;

    public AuthResponse(String accessToken, String refreshToken, String role) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.role = role;
    }

    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public String getRole() { return role; }
}