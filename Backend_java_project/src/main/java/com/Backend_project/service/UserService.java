package com.Backend_project.service;

import com.Backend_project.dto.LoginRequest;
import com.Backend_project.dto.SignupRequest;
import com.Backend_project.dto.ApiResponse;
import com.Backend_project.model.User;
import com.Backend_project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public ApiResponse signup(SignupRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            return ApiResponse.error("Username is already taken!", new HashMap<>());
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return ApiResponse.error("Email is already registered!", new HashMap<>());
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(false);
        user.setAdmin(false);
        user.setBanned(false);

        user = userRepository.save(user);

        Map<String, Object> data = new HashMap<>();
        data.put("user", getUserResponse(user));
        return ApiResponse.success("User registered successfully", data);
    }

    public ApiResponse login(LoginRequest request) {
        // Generic error message for invalid credentials
        Map<String, String> errors = new HashMap<>();
        errors.put("auth", "Invalid email or password");

        // Find user by email
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        // If user not found or password doesn't match, return generic error
        if (userOptional.isEmpty()
                || !passwordEncoder.matches(request.getPassword(), userOptional.get().getPassword())) {
            return ApiResponse.error("Authentication failed", errors);
        }

        User user = userOptional.get();

        // Check if user is banned
        if (user.isBanned()) {
            return ApiResponse.error("Your account has been suspended. Please contact support.", new HashMap<>());
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getId());

        Map<String, Object> data = new HashMap<>();
        Map<String, Object> userResponse = getUserResponse(user);
        data.put("user", userResponse);
        data.put("token", token);

        return ApiResponse.success("Login successful", data);
    }

    private Map<String, Object> getUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("emailVerified", user.isEmailVerified());
        response.put("isAdmin", user.isAdmin());
        response.put("githubConnected", user.isGithubConnected());
        return response;
    }
}