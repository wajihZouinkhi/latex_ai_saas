package com.Backend_project.dto;

import lombok.Data;
import java.util.HashMap;
import java.util.Map;

@Data
public class ApiResponse {
    private boolean success;
    private String message;
    private Map<String, Object> data;
    private Map<String, String> errors;

    public static ApiResponse success(String message, Map<String, Object> data) {
        ApiResponse response = new ApiResponse();
        response.setSuccess(true);
        response.setMessage(message);
        response.setData(data);
        response.setErrors(new HashMap<>());
        return response;
    }

    public static ApiResponse error(String message, Map<String, String> errors) {
        ApiResponse response = new ApiResponse();
        response.setSuccess(false);
        response.setMessage(message);
        response.setData(new HashMap<>());
        response.setErrors(errors);
        return response;
    }
}