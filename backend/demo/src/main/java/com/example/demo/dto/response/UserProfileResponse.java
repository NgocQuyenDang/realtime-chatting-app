package com.example.demo.dto.response;

import lombok.Data;

@Data
public class UserProfileResponse {
    private Long id;
    private String fullname;
    private String email;
}
