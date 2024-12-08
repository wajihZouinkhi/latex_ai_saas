package com.Backend_project.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String username;
    private String email;
    private String password;
    private boolean emailVerified;
    private boolean isAdmin;
    private boolean isBanned;

    // GitHub integration
    private String githubId;
    private String githubUsername;
    private String githubAccessToken;
    private String githubRefreshToken;
    private Date githubTokenExpiresAt;
    private boolean githubConnected;
    private String githubAvatarUrl;
    private String githubEmail;
    private String githubName;
    private String githubScope;
    private Date githubLastSync;

    // Timestamps
    private Date createdAt;
    private Date updatedAt;

    public void onUpdate() {
        this.updatedAt = new Date();
    }

    public boolean isGithubTokenExpired() {
        if (githubTokenExpiresAt == null)
            return true;
        return new Date().after(githubTokenExpiresAt);
    }

    public void updateGithubToken(String accessToken, String refreshToken, long expiresIn) {
        this.githubAccessToken = accessToken;
        this.githubRefreshToken = refreshToken;
        this.githubTokenExpiresAt = new Date(System.currentTimeMillis() + (expiresIn * 1000));
        this.githubLastSync = new Date();
        onUpdate();
    }

    public void clearGithubData() {
        this.githubId = null;
        this.githubUsername = null;
        this.githubAccessToken = null;
        this.githubRefreshToken = null;
        this.githubTokenExpiresAt = null;
        this.githubConnected = false;
        this.githubAvatarUrl = null;
        this.githubEmail = null;
        this.githubName = null;
        this.githubScope = null;
        this.githubLastSync = null;
        onUpdate();
    }

    {
        // Initialization block
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.githubConnected = false;
        this.emailVerified = false;
        this.isAdmin = false;
        this.isBanned = false;
    }
}