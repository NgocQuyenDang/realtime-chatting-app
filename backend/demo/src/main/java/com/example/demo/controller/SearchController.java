package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RequestMapping
public class SearchController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/home/search")
    public ResponseEntity<?> searchUsers(
            @RequestParam String keyword, 
            Authentication authentication
    ) {
        // 1. Lấy email của người dùng đang đăng nhập từ Spring Security Context
        String currentUserEmail = authentication.getName();

        // 2. Gọi Repository quét Database tìm kiếm kết quả
        List<User> matchedUsers = userRepository.searchUsers(keyword, currentUserEmail);

        // 3. Chỉ lọc ra các trường an toàn (fullname, email, id) ném ra Frontend, giấu mật khẩu/OTP đi
        List<Map<String, Object>> response = matchedUsers.stream().map(user -> {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", user.getId());
            item.put("fullname", user.getFullname());
            item.put("email", user.getEmail());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}