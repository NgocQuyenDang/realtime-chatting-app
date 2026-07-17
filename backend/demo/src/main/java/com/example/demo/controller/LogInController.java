package com.example.demo.controller;

import com.example.demo.dto.request.LogInRequest;
import com.example.demo.dto.response.LogInResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.JwtTokenProvider;
import com.example.demo.service.LogInService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LogInController {

    private final LogInService loginService;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<LogInResponse> logInRequest(@Valid @RequestBody LogInRequest request, HttpServletResponse response) {

        User user = loginService.verifyAccount(
                request.getEmail(),
                request.getPassword()
        );

        String token = jwtTokenProvider.generateToken(user);

        Cookie cookie = new Cookie("accessToken", token);
        cookie.setHttpOnly(true);  // Khóa không cho Javascript ở React đọc chuỗi này
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60);

            response.addCookie(cookie);

        return ResponseEntity.ok(new LogInResponse("Đăng nhập thành công"));
    }
}