package com.example.demo.controller;

import com.example.demo.entity.Message;
import com.example.demo.service.SendMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class ChatController {
    @Autowired
    SendMessageService sendMessageService;

    @PostMapping("/chat")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> request, Authentication authentication) {
        Long conversationId = request.get("conversationId") != null ? ((Number) request.get("conversationId")).longValue() : null;
        Long senderId = request.get("senderId") != null ? ((Number) request.get("senderId")).longValue() : null;
        String content = (String) request.get("content");

        Message message = sendMessageService.saveMessage(conversationId, senderId,content);

        return ResponseEntity.ok(message);
    }

    @GetMapping("/chat-history")
    public ResponseEntity<List<Message>> getMessageHistory(Long conversationId) {
        List<Message> messages = sendMessageService.getMessageHistory(conversationId);

        return ResponseEntity.ok(messages);
    }
}
