package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ChatService;
import com.example.demo.service.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class HomeController {
    @Autowired UserRepository userRepository;

    @Autowired
    ChatService chatService;

    @GetMapping("/user-profile")
    public ResponseEntity<?> getUser(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email).orElse(null);

        return ResponseEntity.ok(
                Map.of(
                        "fullname", user.getFullname(),
                        "email", user.getEmail()
                )
        );
    }

    @PostMapping("/access")
    public ResponseEntity<?> startConversation(@RequestBody Map<String, Long> request) {

    }
}
