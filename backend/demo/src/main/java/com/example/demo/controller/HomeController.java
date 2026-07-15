package com.example.demo.controller;

import com.example.demo.entity.Conversation;
import com.example.demo.entity.User;
import com.example.demo.repository.ConversationMemberRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RequiredArgsConstructor
public class HomeController {
    private final UserRepository userRepository;
    private final ConversationService conversationService;

    @GetMapping("/user-profile")
    public ResponseEntity<?> getUser(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email).orElse(null);

        return ResponseEntity.ok(
                Map.of(
                        "id", user.getId(),
                        "fullname", user.getFullname(),
                        "email", user.getEmail()
                )
        );
    }

    @PostMapping("/start-conversation")
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
        Long conversationId = conversationService.getOrCreateConversation(currentUserId, targetUserId);

        return ResponseEntity.ok(Map.of("conversationId", conversationId));
    }

    @GetMapping("/my-conversations")
    public ResponseEntity<?> getMyConversations(Authentication authentication) {
        Optional<User> currentUser = userRepository.findByEmail(authentication.getName());
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }
        Long currentUserId = currentUser.get().getId();

        List<Map<String, Object>> conversations = conversationService.getConversationsList(currentUserId);

        return ResponseEntity.ok(conversations);
    }
}
