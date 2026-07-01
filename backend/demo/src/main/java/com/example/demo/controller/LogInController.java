package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.JwtTokenProvider;
import com.example.demo.service.LoginService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
// 🌟 CHÚ Ý: Đổi origins thành cổng React của em (thường là :3000), bật allowCredentials
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class LogInController {

    @Autowired
    private LoginService loginService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public String logInRequest(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String email = request.get("email");
        String password = request.get("password");

        String result = loginService.verifyAccount(email, password);

        if ("Đăng nhập thành công".equals(result)) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

            String token = jwtTokenProvider.generateToken(user);

            Cookie cookie = new Cookie("accessToken", token);
            cookie.setHttpOnly(true);  // Khóa không cho Javascript ở React đọc chuỗi này
            cookie.setSecure(false);
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60);

            response.addCookie(cookie);
        }
        return result;
    }
}