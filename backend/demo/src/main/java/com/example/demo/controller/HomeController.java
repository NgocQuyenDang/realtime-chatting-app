package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class HomeController {
    @Autowired UserRepository userRepository;

    @Autowired
    ConversationService chatService;

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
    public ResponseEntity<?> startConversation(@RequestBody Map<String, Long> request, Authentication authentication) {
        Optional<User> currentUser = userRepository.findByEmail(authentication.getName());
        Long currentUserId = currentUser.get().getId();

        if (currentUserId == null) {
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }
        Long targetUserId = request.get("targetUserId");

        if (targetUserId == null) {
            return ResponseEntity.badRequest().body("Thiếu thông tin người nhận (targetUserId)");
        }

        if (currentUserId == null) {
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }

        if (currentUserId.equals(targetUserId)) {
            return ResponseEntity.badRequest().body("Bạn không thể tự tạo phòng chat với chính mình.");
        }

        // Lấy phòng cũ hoặc tạo phòng mới
        Long conversationId = chatService.getOrCreateConversation(currentUserId, targetUserId);

        return ResponseEntity.ok(Map.of("conversationId", conversationId));
    }
}
